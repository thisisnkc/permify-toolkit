import { ensureTenant } from "../helpers.js";
import { createPermifyClient } from "../client/index.js";

export interface BaseWriteParams {
  endpoint: string;
  tenantId: string;
  createTenantIfNotExists?: boolean;
  client?: any;
}

export interface BaseWriterResult {
  tenantStatus: {
    created: boolean;
    alreadyExisted: boolean;
  };
}

export abstract class BasePermifyWriter<
  TParams extends BaseWriteParams,
  TResult
> {
  async execute(params: TParams): Promise<TResult & BaseWriterResult> {
    this.validate(params);

    const client =
      params.client || createPermifyClient({ endpoint: params.endpoint });

    const { created, alreadyExisted } = await ensureTenant(
      client,
      params.tenantId,
      !!params.createTenantIfNotExists
    );

    try {
      const result = await this.performWrite(client, params);
      return { ...result, tenantStatus: { created, alreadyExisted } };
    } catch (error: any) {
      if (created) {
        await this.rollbackTenant(client, params.tenantId, error);
      }
      throw error;
    }
  }

  protected validate(params: TParams): void {
    if (!params.client && !params.endpoint) {
      throw new Error("Either endpoint or client must be provided");
    }
    if (!params.tenantId) throw new Error("Tenant ID is required");
  }

  protected abstract performWrite(
    client: any,
    params: TParams
  ): Promise<TResult>;

  private async rollbackTenant(
    client: any,
    tenantId: string,
    originalError: Error
  ): Promise<never> {
    try {
      await client.tenancy.delete({ id: tenantId });
      throw new Error(
        `Operation failed: ${originalError.message}. Tenant ${tenantId} was rolled back (deleted).`
      );
    } catch (rollbackErr: any) {
      if (rollbackErr.message.includes("Operation failed:")) {
        throw rollbackErr;
      }
      throw new Error(
        `Operation failed: ${originalError.message}. Rollback failed: ${rollbackErr.message}. Tenant ${tenantId} may be in an inconsistent state.`
      );
    }
  }
}
