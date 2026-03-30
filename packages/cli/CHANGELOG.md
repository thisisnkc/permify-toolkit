# @permify-toolkit/cli

## 1.2.0

### Minor Changes

- eecc8b1: Add relationships list and export CLI commands for querying and exporting relationship tuples from a Permify tenant. Includes new readRelationships core function with pagination support, shared filter flag helpers, and two output formats (table and compact).

### Patch Changes

- Updated dependencies [eecc8b1]
  - @permify-toolkit/core@1.2.0

## 1.1.0

### Minor Changes

- 42daa4a: Add `schema validate` command that lints and validates schema syntax and references offline without pushing to Permify. Supports both TypeScript DSL schemas (full semantic validation) and `.perm` files (structural checks).

### Patch Changes

- Updated dependencies [42daa4a]
  - @permify-toolkit/core@1.1.0

## 1.0.1

### Patch Changes

- bc7286f: updated README with link to main repository documentation
- Updated dependencies [bc7286f]
  - @permify-toolkit/core@1.0.1
