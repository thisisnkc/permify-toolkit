import {
  BasePermifyWriter,
  type BaseWriteParams,
  type BaseWriterResult
} from "../common/base-writer.js";

export interface Relationship {
  entity: {
    type: string;
    id: string;
  };
  relation: string;
  subject: {
    type: string;
    id: string;
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

export interface DeleteRelationshipsParams extends BaseWriteParams {
  filter: {
    entity?: {
      type: string;
      ids?: string[];
    };
    relation?: string;
    subject?: {
      type: string;
      ids?: string[];
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

// Writes relationships to the Permify server.
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
 */
export async function deleteRelationships(
  params: DeleteRelationshipsParams
): Promise<DeleteRelationshipsResult> {
  const deleter = new RelationshipDeleter();
  return deleter.execute(params);
}
