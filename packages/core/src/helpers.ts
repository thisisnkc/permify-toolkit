export interface TenantOperationResult {
  created: boolean;
  alreadyExisted: boolean;
}

/**
 * Helper to check if a tenant exists using pagination.
 */
export async function checkTenantExists(
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
export async function ensureTenant(
  client: any,
  tenantId: string,
  shouldCreate: boolean
): Promise<TenantOperationResult> {
  if (shouldCreate) {
    try {
      await client.tenancy.create({ id: tenantId, name: tenantId });
      return { created: true, alreadyExisted: false };
    } catch (err: any) {
      // Ignore "already exists" errors:
      // - code 6 is ALREADY_EXISTS in standard gRPC
      // - ERROR_CODE_UNIQUE_CONSTRAINT is Permify's specific error message
      const isAlreadyExists =
        err.code === 6 ||
        err.message.includes("already exists") ||
        err.message.includes("ERROR_CODE_UNIQUE_CONSTRAINT");

      if (!isAlreadyExists) {
        throw err;
      }
      throw new Error(
        `Tenant with name ${tenantId} already exists (ERROR_CODE_UNIQUE_CONSTRAINT)`
      );
    }
  }

  const exists = await checkTenantExists(client, tenantId);
  if (!exists) {
    throw new Error(
      `Tenant "${tenantId}" not found. Use --create-tenant to create it automatically.`
    );
  }

  return { created: false, alreadyExisted: true };
}
