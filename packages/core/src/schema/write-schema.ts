import type { SchemaAST } from "../schema/ast.js";
import { compileToPermify } from "../schema/compiler.js";
import { createPermifyClient } from "../client/index.js";

export async function writeSchemaToPermify(params: {
  endpoint: string;
  tenantId: string;
  ast: SchemaAST;
  createTenantIfNotExists?: boolean;
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

  const client = createPermifyClient(endpoint);

  if (createTenantIfNotExists) {
    try {
      await client.tenancy.create({ id: tenantId, name: tenantId });
    } catch (err: any) {
      if (err.code !== 6 && !err.message.includes("already exists")) {
        throw err;
      }
    }
  } else {
    // Check if tenant exists
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

  await client.schema.write({
    tenantId: params.tenantId,
    schema: compiled
  });

  return { compiledSchema: compiled };
}
