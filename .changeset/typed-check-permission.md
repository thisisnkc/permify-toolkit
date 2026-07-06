---
"@permify-toolkit/core": minor
"@permify-toolkit/nestjs": minor
---

Add typed entity and permission names from the schema DSL.

- `core`: `entity()` now preserves the literal relation and permission keys of its definition, and a new `PermissionName<H>` type derives the union of a schema's checkable identifiers (qualified `"document.view"` and bare `"view"`, covering permissions and relations).
- `nestjs`: new `createPermifyDecorators<typeof schema>()` returns a `CheckPermission` decorator constrained to that schema's names — invalid names are a compile error with editor autocomplete. The untyped `CheckPermission` is unchanged for `.perm`-file users.
