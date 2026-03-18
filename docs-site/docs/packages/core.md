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

const { allowed } = await checkPermission(client, {
  tenantId: "my-tenant",
  entity: { type: "document", id: "doc-1" },
  permission: "view",
  subject: { type: "user", id: "user-123" }
});
```

### Writing Relationships

```typescript
import { writeRelationships } from "@permify-toolkit/core";

await writeRelationships(client, {
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

### Deleting Relationships

```typescript
import { deleteRelationships } from "@permify-toolkit/core";

await deleteRelationships(client, {
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

## API Reference

### Exports

| Export                   | Description                             |
| ------------------------ | --------------------------------------- |
| `schema()`               | Create a schema definition              |
| `entity()`               | Define an entity type                   |
| `relation()`             | Define a relation on an entity          |
| `attribute()`            | Define an attribute on an entity        |
| `permission()`           | Define a permission rule                |
| `defineConfig()`         | Create a typed config object            |
| `validateConfig()`       | Validate a config object                |
| `schemaFile()`           | Reference a `.perm` schema file         |
| `createPermifyClient()`  | Create a gRPC client                    |
| `clientOptionsFromEnv()` | Read client options from env vars       |
| `checkPermission()`      | Check a permission                      |
| `writeRelationships()`   | Write relationship tuples               |
| `deleteRelationships()`  | Delete relationship tuples              |
| `relationsOf()`          | Helper to extract relations from schema |
