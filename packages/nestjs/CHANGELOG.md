# @permify-toolkit/nestjs

## 1.2.0

### Minor Changes

- f144023: Add `@PermissionResult()` param decorator — injects guard-computed permission check results into handler parameters without a second gRPC round-trip.
- 4deb4c8: `@PermissionResult()` accepts an optional permission name and injects a boolean; qualified names (`document.edit`) are normalized to match guard results.
- 4e39cd0: Add typed entity and permission names from the schema DSL.

  - `core`: `entity()` now preserves the literal relation and permission keys of its definition, and a new `PermissionName<H>` type derives the union of a schema's checkable identifiers (qualified `"document.view"` and bare `"view"`, covering permissions and relations).
  - `nestjs`: new `createPermifyDecorators<typeof schema>()` returns a `CheckPermission` decorator constrained to that schema's names — invalid names are a compile error with editor autocomplete. The untyped `CheckPermission` is unchanged for `.perm`-file users.

### Patch Changes

- Updated dependencies [4e39cd0]
  - @permify-toolkit/core@1.5.0

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
