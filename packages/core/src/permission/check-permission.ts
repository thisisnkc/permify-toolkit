/**
 * Parameters for a fine-grained permission check.
 */
export interface CheckPermissionParams {
  /** The Permify tenant ID. */
  tenantId: string;
  /**
   * Optional metadata.
   *
   * By default, `depth` is set to `20`. You can also provide `snapToken`
   * or `schemaVersion` here.
   */
  metadata?: {
    /** Snap token for consistent reads across requests. */
    snapToken?: string;
    /** Specific schema version to check against. */
    schemaVersion?: string;
    /** Max recursion depth for the check (defaults to 20). */
    depth?: number;
    /** Map of attribute values for attribute-based access control. */
    attributes?: Record<string, any>;
  };
  /** The subject requesting access (e.g. `user:1`). */
  subject: { type: string; id: string };
  /** The entity being accessed (e.g. `document:doc-1`). */
  entity: { type: string; id: string };
  /** The permission or relation name to check (e.g. `view`, `edit`). */
  permission: string;
}

/**
 * Checks if a subject has permission to perform an action on a specific entity.
 *
 * This function handles the conversion of the Permify gRPC response to a simple
 * boolean. It also applies a default `depth: 20` to the metadata if not provided,
 * which is often required for complex schema traversals.
 *
 * @param client - The Permify gRPC client instance.
 * @param params - The permission check details (subject, entity, action).
 * @returns A promise that resolves to `true` if access is allowed, `false` otherwise.
 *
 * @example
 * ```typescript
 * const isAllowed = await checkPermission(client, {
 *   tenantId: 'my-app',
 *   subject: { type: 'user', id: 'alice' },
 *   entity: { type: 'document', id: 'finance-report' },
 *   permission: 'view',
 * });
 * ```
 */
export async function checkPermission(
  client: any,
  params: CheckPermissionParams
): Promise<boolean> {
  // The Permify server requires metadata.depth >= 3.
  // Apply a sensible default so callers don't have to remember.
  const metadata = {
    depth: 20,
    ...params.metadata
  };

  const allowed = await client.permission.check({
    ...params,
    metadata
  });
  // CheckResult.ALLOWED is usually 1 in Permify gRPC
  return allowed.can === 1;
}
