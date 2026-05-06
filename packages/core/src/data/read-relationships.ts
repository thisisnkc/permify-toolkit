import type { Relationship } from "./write-relationships.js";
import { tupleFilter, type TupleFilterInput } from "./tuple-filter.js";

export interface ReadRelationshipsParams {
  client: any;
  tenantId: string;
  filter: TupleFilterInput & { entity: { type: string; ids?: string[] } };
  pageSize?: number;
}

export async function readRelationships(
  params: ReadRelationshipsParams
): Promise<Relationship[]> {
  const { client, tenantId, filter, pageSize = 50 } = params;

  const normalizedFilter = tupleFilter(filter);

  const allTuples: Relationship[] = [];
  let continuousToken = "";

  do {
    const response = await client.data.readRelationships({
      tenantId,
      metadata: { snapToken: "" },
      filter: normalizedFilter,
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
