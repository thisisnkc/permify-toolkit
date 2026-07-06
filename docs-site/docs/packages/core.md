---
sidebar_position: 1
---

# @permify-toolkit/core

The core engine of the Permify Toolkit — schema DSL, client factory, permission/relationship helpers.

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/core)](https://www.npmjs.com/package/@permify-toolkit/core)

## Installation

```bash
pnpm add @permify-toolkit/core
# or
npm install @permify-toolkit/core
```

## Why Core?

While the official `@permify/permify-node` provides the raw gRPC client, `@permify-toolkit/core` is built for **productivity, type-safety, and shared configuration**:

- **Type-Safe Schema DSL** — stop writing schemas as raw strings. Use a fluent API with full IDE autocomplete.
- **Developer Ergonomics** — `checkPermission` and `writeRelationships` are simplified into single-function calls.
- **Environment-First** — native support for environment variable configuration with customizable prefixes.
- **Shared Configuration** — use `permify.config.ts` once to power your app, CLI, and NestJS module.

## Type-Safe Schema DSL

Define your authorization model in TypeScript:

```typescript
import { schema, entity, relation, permission } from "@permify-toolkit/core";

const mySchema = schema({
  user: entity({}),
  document: entity({
    relations: {
      owner: relation("user"),
      editor: relation("user")
    },
    permissions: {
      edit: permission("owner", "editor"),
      view: permission("owner", "editor")
    }
  })
});
```

This gives you compile-time safety — referencing a non-existent entity or relation is a type error.

The `PermissionName` type extracts every checkable identifier from a schema, i.e., permissions and relations, in qualified and bare form:

```typescript
import type { PermissionName } from "@permify-toolkit/core";

type Names = PermissionName<typeof mySchema>;
// "document.edit" | "document.view" | "document.owner" | "document.editor"
// | "edit" | "view" | "owner" | "editor"
```

This powers typed decorators in `@permify-toolkit/nestjs` (see [Typed Permission Names](./nestjs.md#typed-permission-names)) and can constrain your own helpers.

## Client Utilities

### Creating a Client

```typescript
import { createPermifyClient } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "localhost:3478",
  insecure: true
});
```

Or from environment variables:

```typescript
import {
  createPermifyClient,
  clientOptionsFromEnv
} from "@permify-toolkit/core";

const client = createPermifyClient(clientOptionsFromEnv());
```

See [Configuration](/docs/configuration) for all client options.

### Checking Permissions

```typescript
import { checkPermission } from "@permify-toolkit/core";

const allowed = await checkPermission(client, {
  tenantId: "my-tenant",
  entity: { type: "document", id: "doc-1" },
  permission: "view",
  subject: { type: "user", id: "user-123" }
});
```

### Writing Relationships

```typescript
import { writeRelationships } from "@permify-toolkit/core";

await writeRelationships({
  client,
  tenantId: "my-tenant",
  tuples: [
    {
      entity: { type: "document", id: "doc-1" },
      relation: "owner",
      subject: { type: "user", id: "user-123" }
    }
  ]
});
```

You can pass `client` (recommended) or just an `endpoint` string — the helper will create a client for you. Either is sufficient; you don't need both.

### Reading Relationships

Query existing relationship tuples from a tenant. Handles pagination automatically — all matching tuples are returned in a single array.

```typescript
import { readRelationships } from "@permify-toolkit/core";

const tuples = await readRelationships({
  client,
  tenantId: "my-tenant",
  filter: {
    entity: { type: "document" }
  }
});

// tuples = [
//   { entity: { type: "document", id: "doc-1" }, relation: "owner", subject: { type: "user", id: "alice" } },
//   { entity: { type: "document", id: "doc-1" }, relation: "viewer", subject: { type: "user", id: "bob" } },
//   ...
// ]
```

**Filter options:**

```typescript
// Filter by entity type only (returns all relationships for that type)
await readRelationships({
  client,
  tenantId: "t1",
  filter: { entity: { type: "document" } }
});

// Filter by specific entity
await readRelationships({
  client,
  tenantId: "t1",
  filter: { entity: { type: "document", ids: ["doc-1"] } }
});

// Filter by relation
await readRelationships({
  client,
  tenantId: "t1",
  filter: {
    entity: { type: "document" },
    relation: "viewer"
  }
});

// Filter by subject
await readRelationships({
  client,
  tenantId: "t1",
  filter: {
    entity: { type: "document" },
    subject: { type: "user", ids: ["alice"] }
  }
});

// Control page size for large datasets
await readRelationships({
  client,
  tenantId: "t1",
  filter: { entity: { type: "document" } },
  pageSize: 100 // default: 50
});
```

### Deleting Relationships

Deletes happen by filter, not by tuple. Provide any combination of `entity`, `relation`, and `subject` — anything you omit is treated as "match anything".

```typescript
import { deleteRelationships } from "@permify-toolkit/core";

// Remove every relationship on a specific document
await deleteRelationships({
  client,
  tenantId: "my-tenant",
  filter: { entity: { type: "document", ids: ["doc-1"] } }
});

// Remove just the owner edge between alice and doc-1
await deleteRelationships({
  client,
  tenantId: "my-tenant",
  filter: {
    entity: { type: "document", ids: ["doc-1"] },
    relation: "owner",
    subject: { type: "user", ids: ["alice"] }
  }
});
```

### Building Filters with `tupleFilter`

Both `readRelationships` and `deleteRelationships` accept a partial filter and fill in defaults internally. If you need the fully-normalized gRPC shape (e.g. you're calling `client.data.*` directly, building filters in a helper, or asserting in tests), use `tupleFilter`:

```typescript
import { tupleFilter } from "@permify-toolkit/core";

const filter = tupleFilter({
  entity: { type: "document" },
  relation: "viewer"
});
// {
//   entity: { type: "document", ids: [] },
//   relation: "viewer",
//   subject: { type: "", ids: [], relation: "" }
// }
```

## Reading Schemas

Read the currently deployed schema from a Permify server. This is useful for inspecting what's live, building migration scripts, or comparing against a local definition.

```typescript
import {
  createPermifyClient,
  readSchemaFromPermify
} from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "localhost:3478",
  insecure: true
});

const result = await readSchemaFromPermify({
  client,
  tenantId: "my-tenant"
});

if (result.schema) {
  console.log("Deployed schema DSL:\n", result.schema);
  console.log("Entities:", Object.keys(result.entities));
  // e.g. { user: { relations: {}, permissions: {} }, document: { relations: { owner: "@user" }, permissions: { edit: "owner" } } }
} else {
  console.log("No schema deployed yet for this tenant.");
}
```

The returned `entities` map contains each entity's relations and permissions with their definitions — relation targets (e.g., `@user`) and permission expressions (e.g., `owner or editor`).

## Schema Diffing

Compare two schemas structurally to see what entities, relations, and permissions were added, removed, or changed. This powers the CLI's `schema diff` command, but you can use it directly for custom CI checks, migration previews, or programmatic workflows.

### Structural Diff

`diffSchema` compares two entity maps and returns a structured result:

```typescript
import {
  readSchemaFromPermify,
  diffSchema,
  type SchemaEntityMap
} from "@permify-toolkit/core";

// Define your local schema as a flat entity map
const local: SchemaEntityMap = {
  user: { relations: {}, permissions: {} },
  document: {
    relations: { owner: "@user", editor: "@user" },
    permissions: { view: "owner or editor", edit: "owner" }
  }
};

// Read the deployed schema from the server
const remote = await readSchemaFromPermify({ client, tenantId: "my-tenant" });

const result = diffSchema(local, remote.entities);

if (!result.hasChanges) {
  console.log("Schemas are identical.");
} else {
  for (const entity of result.added) {
    console.log(`+ New entity: ${entity.name}`);
  }
  for (const entity of result.removed) {
    console.log(`- Removed entity: ${entity.name}`);
  }
  for (const entity of result.modified) {
    console.log(`~ Modified: ${entity.name}`);
    console.log("  Relations added:", entity.relations.added);
    console.log("  Relations removed:", entity.relations.removed);
    console.log("  Relations changed:", entity.relations.changed);
    console.log("  Permissions added:", entity.permissions.added);
    console.log("  Permissions removed:", entity.permissions.removed);
    console.log("  Permissions changed:", entity.permissions.changed);
  }
}
```

This is useful for building custom guardrails — for example, failing a deploy if permissions were removed without an explicit approval step.

### Text Diff

`textDiff` generates a unified diff (like `git diff`) between two schema DSL strings:

```typescript
import { textDiff } from "@permify-toolkit/core";

const remoteDsl =
  "entity user {}\nentity document {\n    relation owner @user\n    permission view = owner\n}";
const localDsl =
  "entity user {}\nentity document {\n    relation owner @user\n    relation editor @user\n    permission view = owner or editor\n}";

const diff = textDiff(localDsl, remoteDsl, "local", "remote");

if (diff) {
  console.log(diff);
  // --- remote
  // +++ local
  // @@ -2,4 +2,5 @@
  //  entity document {
  //      relation owner @user
  // +    relation editor @user
  // -    permission view = owner
  // +    permission view = owner or editor
  //  }
}
```

This pairs well with `diffSchema` — use the structural diff for programmatic decisions, and the text diff for human-readable output in logs or PR comments.

## Centralized Configuration

Create a `permify.config.ts` in your root. The `defineConfig` helper makes your config compatible with CLI and NestJS:

```typescript
import { defineConfig } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "my-tenant",
  client: {
    endpoint: process.env.PERMIFY_URL,
    insecure: false
  }
});
```

### Loading a Config File

`loadConfig` resolves and validates a `permify.config.ts`. By default it looks in `process.cwd()`; pass `cwd` to resolve from another directory, or pass an explicit path as the first argument.

```typescript
import { loadConfig } from "@permify-toolkit/core";

const config = await loadConfig(); // ./permify.config.ts
const fromMonorepoRoot = await loadConfig(undefined, { cwd: "/repo/root" });
const customPath = await loadConfig("./configs/permify.ts");
```

If you already have an in-memory config object (e.g. from a test fixture), skip `loadConfig` entirely and use `defineConfig` + `validateConfig` directly — no filesystem access required.

## API Reference

### Exports

| Export                    | Description                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `schema()`                | Create a schema definition                                                                              |
| `entity()`                | Define an entity type                                                                                   |
| `relation()`              | Define a relation on an entity                                                                          |
| `attribute()`             | Define an attribute on an entity                                                                        |
| `permission()`            | Define a permission rule                                                                                |
| `defineConfig()`          | Create a typed config object                                                                            |
| `validateConfig()`        | Validate a config object                                                                                |
| `schemaFile()`            | Reference a `.perm` schema file                                                                         |
| `loadConfig()`            | Load and validate a `permify.config.ts` from disk                                                       |
| `SeedingMode`             | Enum of seeding strategies (`APPEND`, `REPLACE`) used by config and CLI                                 |
| `createPermifyClient()`   | Create a gRPC client                                                                                    |
| `clientOptionsFromEnv()`  | Read client options from env vars                                                                       |
| `checkPermission()`       | Check a permission                                                                                      |
| `writeRelationships()`    | Write relationship tuples                                                                               |
| `readRelationships()`     | Read relationship tuples with filtering and automatic pagination                                        |
| `deleteRelationships()`   | Delete relationship tuples by filter                                                                    |
| `tupleFilter()`           | Build a normalized relationship filter (fills gRPC defaults for omitted fields)                         |
| `relationsOf()`           | Helper to extract relations from schema                                                                 |
| `PermissionName`          | Type union of all permission/relation names in a schema (qualified and bare)                            |
| `getSchemaWarnings()`     | Collect non-blocking warnings from a schema AST (unused relations, empty entities, missing permissions) |
| `readSchemaFromPermify()` | Read the current schema from a Permify server for a given tenant                                        |
| `diffSchema()`            | Compute a structural diff between two schema entity maps                                                |
| `textDiff()`              | Generate a unified text diff between two DSL strings                                                    |
