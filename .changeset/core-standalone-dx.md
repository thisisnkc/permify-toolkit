---
"@permify-toolkit/core": minor
---

Improve standalone DX for relationship and config APIs:

- `BaseWriteParams.endpoint` is now optional when `client` is provided. Affects `writeSchemaToPermify`, `readSchemaFromPermify`, `writeRelationships`, `deleteRelationships`.
- `writeRelationships` now accepts `tuples` directly at the top level. The nested `relationships: { tuples }` form still works but is deprecated.
- New exported helper `tupleFilter()` (and `TupleFilterInput` type) for building Permify-shaped relationship filters from a partial input. `deleteRelationships` now normalizes its `filter` the same way `readRelationships` already did, so partial filters no longer hit the gRPC defaults gap.
- `loadConfig` accepts a `cwd` option to resolve the default config file from a directory other than `process.cwd()`.

No breaking changes.
