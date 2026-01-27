import type { SchemaAST } from "../schema/ast.js";
import { compileToPermify } from "../schema/compiler.js";
import { createPermifyClient } from "../client/index.js";

interface WriteSchemaParams {
  endpoint: string;
  tenantId: string;
  ast: SchemaAST;
  createTenantIfNotExists?: boolean;
  client?: any;
}

interface TenantOperationResult {
  created: boolean;
}

/**
 * Validates the required parameters for writing a schema.
 */
function validateParams(params: WriteSchemaParams): void {
  const { endpoint, tenantId, ast } = params;
  if (!endpoint) throw new Error("Endpoint is required");
  if (!tenantId) throw new Error("Tenant ID is required");
  if (!ast) throw new Error("AST is required");
}

/**
 * Helper to check if a tenant exists using pagination.
 */
async function checkTenantExists(
  client: any,
  tenantId: string
): Promise<boolean> {
  let continuousToken = "";

  do {
    const response = await client.tenancy.list({
      pageSize: 20,
      continuousToken
    });

    if (response.tenants.some((t: any) => t.id === tenantId)) {
      return true;
    }

    continuousToken = response.continuousToken;
  } while (continuousToken);

  return false;
}

/**
 * Ensures the tenant exists, creating it if requested and necessary.
 * Returns metadata indicating if a new tenant was created.
 */
async function ensureTenant(
  client: any,
  tenantId: string,
  shouldCreate: boolean
): Promise<TenantOperationResult> {
  if (shouldCreate) {
    try {
      await client.tenancy.create({ id: tenantId, name: tenantId });
      return { created: true };
    } catch (err: any) {
      // Ignore "already exists" errors (code 6 is ALREADY_EXISTS in standard gRPC)
      if (err.code !== 6 && !err.message.includes("already exists")) {
        throw err;
      }
      return { created: false };
    }
  }

  const exists = await checkTenantExists(client, tenantId);
  if (!exists) {
    throw new Error(
      `Tenant ${tenantId} not found. Use --create-tenant to create it automatically.`
    );
  }

  return { created: false };
}

/**
 * Compiles and writes the schema to the Permify server.
 */
async function deploySchema(client: any, tenantId: string, ast: SchemaAST) {
  const compiled = compileToPermify(ast);
  await client.schema.write({
    tenantId,
    schema: compiled
  });
  return { compiledSchema: compiled };
}

/**
 * Attempts to rollback (delete) a newly created tenant in case of failure.
 */
async function rollbackTenant(
  client: any,
  tenantId: string,
  originalError: Error
): Promise<never> {
  try {
    await client.tenancy.delete({ id: tenantId });
    throw new Error(
      `Schema write failed: ${originalError.message}. Tenant ${tenantId} was rolled back (deleted).`
    );
  } catch (rollbackErr: any) {
    // If the rollback itself fails, we must report both errors to avoid swallowing the critical state issue
    // Ensure we don't throw the original error if we are throwing this new one
    if (rollbackErr.message.includes("Schema write failed:")) {
      throw rollbackErr;
    }

    throw new Error(
      `Schema write failed: ${originalError.message}. Rollback failed: ${rollbackErr.message}. Tenant ${tenantId} may be in an inconsistent state.`
    );
  }
}

/**
 * Writes a compiled schema to a Permify server with transactional safety.
 *
 * This function orchestrates the workflow:
 * 1. Validation
 * 2. Client Initialization
 * 3. Tenant Verification/Creation
 * 4. Schema Deployment
 * 5. Automatic Rollback on Failure
 */
export async function writeSchemaToPermify(params: WriteSchemaParams) {
  validateParams(params);

  const client =
    params.client || createPermifyClient({ endpoint: params.endpoint });

  const { created } = await ensureTenant(
    client,
    params.tenantId,
    !!params.createTenantIfNotExists
  );

  try {
    return await deploySchema(client, params.tenantId, params.ast);
  } catch (error: any) {
    if (created) {
      await rollbackTenant(client, params.tenantId, error);
    }
    throw error;
  }
}
