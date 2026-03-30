import type { Relationship } from "./write-relationships.js";

export interface ReadRelationshipsParams {
  client: any;
  tenantId: string;
  filter: {
    entity: { type: string; ids?: string[] };
    relation?: string;
    subject?: { type: string; ids?: string[]; relation?: string };
  };
  pageSize?: number;
}

export async function readRelationships(
  params: ReadRelationshipsParams
): Promise<Relationship[]> {
  const { client, tenantId, filter, pageSize = 50 } = params;

  const tupleFilter = {
    entity: {
      type: filter.entity.type,
      ids: filter.entity.ids ?? []
    },
    relation: filter.relation ?? "",
    subject: filter.subject
      ? {
          type: filter.subject.type,
          ids: filter.subject.ids ?? [],
          relation: filter.subject.relation ?? ""
        }
      : { type: "", ids: [], relation: "" }
  };

  const allTuples: Relationship[] = [];
  let continuousToken = "";

  do {
    const response = await client.data.readRelationships({
      tenantId,
      metadata: { snapToken: "" },
      filter: tupleFilter,
      pageSize,
      continuousToken
    });

    for (const tuple of response.tuples ?? []) {
      allTuples.push({
        entity: {
          type: tuple.entity?.type ?? "",
          id: tuple.entity?.id ?? ""
        },
        relation: tuple.relation ?? "",
        subject: {
          type: tuple.subject?.type ?? "",
          id: tuple.subject?.id ?? "",
          ...(tuple.subject?.relation
            ? { relation: tuple.subject.relation }
            : {})
        }
      });
    }

    continuousToken = response.continuousToken ?? "";
  } while (continuousToken);

  return allTuples;
}
