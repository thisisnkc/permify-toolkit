# @permify-toolkit/core

## 1.5.0

### Minor Changes

- 4e39cd0: Add typed entity and permission names from the schema DSL.

  - `core`: `entity()` now preserves the literal relation and permission keys of its definition, and a new `PermissionName<H>` type derives the union of a schema's checkable identifiers (qualified `"document.view"` and bare `"view"`, covering permissions and relations).
  - `nestjs`: new `createPermifyDecorators<typeof schema>()` returns a `CheckPermission` decorator constrained to that schema's names — invalid names are a compile error with editor autocomplete. The untyped `CheckPermission` is unchanged for `.perm`-file users.

## 1.4.0

### Minor Changes

- 77e5f1a: Improve standalone DX for relationship and config APIs:
  - `BaseWriteParams.endpoint` is now optional when `client` is provided. Affects `writeSchemaToPermify`, `readSchemaFromPermify`, `writeRelationships`, `deleteRelationships`.
  - `writeRelationships` now accepts `tuples` directly at the top level. The nested `relationships: { tuples }` form still works but is deprecated.
  - New exported helper `tupleFilter()` (and `TupleFilterInput` type) for building Permify-shaped relationship filters from a partial input. `deleteRelationships` now normalizes its `filter` the same way `readRelationships` already did, so partial filters no longer hit the gRPC defaults gap.
  - `loadConfig` accepts a `cwd` option to resolve the default config file from a directory other than `process.cwd()`.

  No breaking changes.

## 1.3.1

### Patch Changes

- afd3ca6: Add dual ESM/CJS build output. Packages now ship both `.mjs` (ESM) and `.cjs` (CJS) formats via tsup, enabling `require()` in CommonJS environments like default NestJS projects.

## 1.3.0

### Minor Changes

- c3d27e7: feat: add schema diff command to preview changes before pushing
  - New CLI command `schema diff` compares local schema against the deployed schema on the Permify server
  - Supports local-vs-local comparison via `--source` flag (no server needed)
  - Structural summary shows added, removed, and modified entities, relations, and permissions
  - `--verbose` flag shows a unified text diff for full detail
  - `--exit-code` flag exits with code 1 when changes are detected (for CI pipelines)
  - New core exports: `readSchemaFromPermify`, `diffSchema`, `textDiff`

## 1.2.0

### Minor Changes

- eecc8b1: Add relationships list and export CLI commands for querying and exporting relationship tuples from a Permify tenant. Includes new readRelationships core function with pagination support, shared filter flag helpers, and two output formats (table and compact).

## 1.1.0

### Minor Changes

- 42daa4a: Add `schema validate` command that lints and validates schema syntax and references offline without pushing to Permify. Supports both TypeScript DSL schemas (full semantic validation) and `.perm` files (structural checks).

## 1.0.1

### Patch Changes

- bc7286f: updated README with link to main repository documentation
