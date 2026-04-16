# @permify-toolkit/nestjs

## 1.1.1

### Patch Changes

- afd3ca6: Add dual ESM/CJS build output. Packages now ship both `.mjs` (ESM) and `.cjs` (CJS) formats via tsup, enabling `require()` in CommonJS environments like default NestJS projects.
- Updated dependencies [afd3ca6]
  - @permify-toolkit/core@1.3.1

## 1.1.0

### Minor Changes

- bc7286f: add support for multiple permission checks (AND/OR logic) in @CheckPermission

### Patch Changes

- Updated dependencies [bc7286f]
  - @permify-toolkit/core@1.0.1
