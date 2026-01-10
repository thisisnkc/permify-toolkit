import type { RelationDef } from "./define-schema.js";

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
