# @permify-toolkit/core

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/core)](https://www.npmjs.com/package/@permify-toolkit/core)
[![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit)](https://github.com/thisisnkc/permify-toolkit/blob/main/LICENSE)

Type-safe schema DSL, client factory, and permission/relationship helpers for [Permify](https://github.com/Permify/permify).

## Installation

```bash
pnpm add @permify-toolkit/core
```

## Quick Example

```typescript
import { schema, entity, relation, permission, defineConfig } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({
    user: entity({}),
    document: entity({
      relations: { owner: relation("user"), editor: relation("user") },
      permissions: { edit: permission("owner", "editor"), view: permission("owner", "editor") }
    })
  })
});
```

```typescript
import { createPermifyClient, checkPermission } from "@permify-toolkit/core";

const client = createPermifyClient({ endpoint: "localhost:3478", insecure: true });

const { allowed } = await checkPermission(client, {
  tenantId: "t1",
  entity: { type: "document", id: "doc-1" },
  permission: "view",
  subject: { type: "user", id: "user-123" }
});
```

## Features

- **Type-Safe Schema DSL** — define entities, relations, and permissions with full IDE autocomplete
- **Client Factory** — create gRPC clients from code or environment variables
- **Permission Checks** — simplified `checkPermission()` single-function calls
- **Relationship Management** — `writeRelationships()` and `deleteRelationships()` helpers
- **Shared Config** — `permify.config.ts` powers your app, CLI, and NestJS module

## Documentation

For full documentation, guides, and API reference, visit the **[Permify Toolkit Docs](https://thisisnkc.github.io/permify-toolkit/)**.
