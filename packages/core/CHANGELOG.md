# @permify-toolkit/core

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
