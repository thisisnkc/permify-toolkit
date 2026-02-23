import type { RelationDef } from "./define-schema.js";

/**
 * Helper to generate relationship definitions for multiple names targeting the same entity.
 *
 * This is useful when an entity has multiple relations that all point to the same
 * base type (e.g. `owner`, `editor`, and `viewer` all targeting `'user'`).
 *
 * @param target - The target entity type.
 * @param names - The list of relation names.
 * @returns A record of relation definitions.
 *
 * @example
 * ```typescript
 * entity({
 *   relations: {
 *     ...relationsOf('user', ['owner', 'editor', 'viewer'])
 *   }
 * })
 * ```
 */
export function relationsOf(
  target: string,
  names: readonly string[]
): Record<string, RelationDef> {
  const result: Record<string, RelationDef> = {};
  for (const name of names) {
    result[name] = { targets: [target] };
  }
  return result;
}
