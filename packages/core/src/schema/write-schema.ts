import type { SchemaAST } from "../schema/ast.js";
import { compileToPermify } from "../schema/compiler.js";
import { createPermifyClient } from "../client/index.js";
/**
 * Writes a compiled schema to a Permify server with transactional safety.
 *
 * This function handles the complete workflow of writing a schema to Permify:
 * - Validates that the tenant exists (or creates it if requested)
 * - Compiles the schema AST to Permify DSL format
 * - Writes the schema to the Permify server
 * - Automatically rolls back tenant creation if schema write fails
 *
 * The rollback mechanism ensures data consistency: if a tenant is created during
 * this operation but the schema write fails, the newly created tenant will be
 * automatically deleted to prevent orphaned tenants.
 */
export async function writeSchemaToPermify(params: {
  endpoint: string;
  tenantId: string;
  ast: SchemaAST;
  createTenantIfNotExists?: boolean;
  client?: any;
}) {
  const { endpoint, tenantId, ast, createTenantIfNotExists } = params;

  if (!endpoint) {
    throw new Error("Endpoint is required");
  }

  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (!ast) {
    throw new Error("AST is required");
  }

  const client = params.client || createPermifyClient(endpoint);
  let createdTenant = false;

  if (createTenantIfNotExists) {
    try {
      await client.tenancy.create({ id: tenantId, name: tenantId });
      createdTenant = true;
    } catch (err: any) {
      if (err.code !== 6 && !err.message.includes("already exists")) {
        throw err;
      }
    }
  } else {
    let continuousToken = "";
    let found = false;

    do {
      const response = await client.tenancy.list({
        pageSize: 20,
        continuousToken
      });

      if (response.tenants.some((t: any) => t.id === tenantId)) {
        found = true;
        break;
      }

      continuousToken = response.continuousToken;
    } while (continuousToken);

    if (!found) {
      throw new Error(
        `Tenant ${tenantId} not found. Use --create-tenant to create it automatically.`
      );
    }
  }

  const compiled = compileToPermify(ast);

  try {
    await client.schema.write({
      tenantId,
      schema: compiled
    });
  } catch (err: any) {
    if (createdTenant) {
      try {
        await client.tenancy.delete({ id: tenantId });
        throw new Error(
          `Schema write failed: ${err.message}. Tenant ${tenantId} was rolled back (deleted).`
        );
      } catch (rollbackErr: any) {
        throw new Error(
          `Schema write failed: ${err.message}. Rollback failed: ${rollbackErr.message}. Tenant ${tenantId} may be in an inconsistent state.`
        );
      }
    }
    throw err;
  }

  return { compiledSchema: compiled };
}
