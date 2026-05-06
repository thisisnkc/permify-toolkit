/**
 * Developer-facing input shape for filtering relationship tuples.
 *
 * Optional fields default to "any" when omitted: missing `relation` matches
 * every relation, missing `subject` matches every subject, etc.
 */
export interface TupleFilterInput {
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
}

/**
 * Normalizes a {@link TupleFilterInput} into the shape Permify's gRPC API
 * expects (every field present, defaults filled in).
 *
 * Use this when calling {@link readRelationships} or {@link deleteRelationships}
 * with a partial filter, or when constructing filters by hand.
 *
 * @example
 * ```typescript
 * const filter = tupleFilter({ entity: { type: "document" } });
 * await deleteRelationships({ client, tenantId: "t1", filter });
 * ```
 */
export function tupleFilter(input: TupleFilterInput = {}) {
  return {
    entity: {
      type: input.entity?.type ?? "",
      ids: input.entity?.ids ?? []
    },
    relation: input.relation ?? "",
    subject: input.subject
      ? {
          type: input.subject.type,
          ids: input.subject.ids ?? [],
          relation: input.subject.relation ?? ""
        }
      : { type: "", ids: [], relation: "" }
  };
}
