import {
  BasePermifyWriter,
  type BaseWriteParams,
  type BaseWriterResult
} from "../common/base-writer.js";

/**
 * Represents a single relationship tuple in Permify.
 *
 * A relationship links an entity to a subject via a specific relation.
 *
 * @example
 * ```typescript
 * const tuple: Relationship = {
 *   entity: { type: 'document', id: 'doc-1' },
 *   relation: 'owner',
 *   subject: { type: 'user', id: 'user-1' },
 * };
 * ```
 */
export interface Relationship {
  /** The entity being targeted (e.g. `document:doc-1`). */
  entity: {
    /** The entity type (e.g. `document`). */
    type: string;
    /** The unique entity ID. */
    id: string;
  };
  /** The name of the relation (e.g. `owner`, `viewer`). */
  relation: string;
  /** The subject being granted the relation (e.g. `user:user-1`). */
  subject: {
    /** The subject type (e.g. `user`, `organization`). */
    type: string;
    /** The unique subject ID. */
    id: string;
    /** Optional relation if the subject is itself a relation (e.g. `organization#member`). */
    relation?: string;
  };
}

interface WriteRelationshipsParams extends BaseWriteParams {
  relationships: {
    tuples: Relationship[];
  };
}

interface WriteRelationshipsResult extends BaseWriterResult {
  success: boolean;
  count: number;
}

/**
 * Parameters for deleting relationships based on a filter.
 */
export interface DeleteRelationshipsParams extends BaseWriteParams {
  /**
   * Filter criteria for finding relationships to delete.
   * At least one filter criteria should be provided.
   */
  filter: {
    /** Filter by target entity. */
    entity?: {
      /** Target entity type. */
      type: string;
      /** Optional list of specific entity IDs. */
      ids?: string[];
    };
    /** Filter by relation name. */
    relation?: string;
    /** Filter by subject. */
    subject?: {
      /** Subject type. */
      type: string;
      /** Optional list of specific subject IDs. */
      ids?: string[];
      /** Optional subject relation (e.g. `member`). */
      relation?: string;
    };
  };
}

interface DeleteRelationshipsResult extends BaseWriterResult {
  success: boolean;
}

class RelationshipWriter extends BasePermifyWriter<
  WriteRelationshipsParams,
  { success: boolean; count: number }
> {
  protected async performWrite(
    client: any,
    params: WriteRelationshipsParams
  ): Promise<{ success: boolean; count: number }> {
    const tuples = params.relationships.tuples;

    await client.data.write({
      tenantId: params.tenantId,
      metadata: {
        schemaVersion: ""
      },
      tuples
    });

    return { success: true, count: tuples.length };
  }
}

/**
 * Writes one or more relationship tuples to the Permify server.
 *
 * @param params - The relationships to write and the target tenant.
 * @returns A promise that resolves with the result (success flag and count).
 *
 * @example
 * ```typescript
 * const res = await writeRelationships({
 *   tenantId: 'my-tenant',
 *   relationships: {
 *     tuples: [{
 *       entity: { type: 'document', id: '1' },
 *       relation: 'owner',
 *       subject: { type: 'user', id: 'user-1' },
 *     }]
 *   }
 * });
 * ```
 */
export async function writeRelationships(
  params: WriteRelationshipsParams
): Promise<WriteRelationshipsResult> {
  const writer = new RelationshipWriter();
  return writer.execute(params);
}

class RelationshipDeleter extends BasePermifyWriter<
  DeleteRelationshipsParams,
  { success: boolean }
> {
  protected async performWrite(
    client: any,
    params: DeleteRelationshipsParams
  ): Promise<{ success: boolean }> {
    await client.data.delete({
      tenantId: params.tenantId,
      filter: params.filter
    });

    return { success: true };
  }
}

/**
 * Deletes relationships from the Permify server based on a filter.
 *
 * @param params - The deletion filter and the target tenant.
 * @returns A promise that resolves with the result (success flag).
 *
 * @example
 * ```typescript
 * await deleteRelationships({
 *   tenantId: 'my-tenant',
 *   filter: {
 *     entity: { type: 'document', id: '1' },
 *     relation: 'owner',
 *   }
 * });
 * ```
 */
export async function deleteRelationships(
  params: DeleteRelationshipsParams
): Promise<DeleteRelationshipsResult> {
  const deleter = new RelationshipDeleter();
  return deleter.execute(params);
}
