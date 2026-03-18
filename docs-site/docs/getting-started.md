---
sidebar_position: 2
---

# Getting Started

Get up and running with Permify Toolkit in under 5 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) (recommended) or npm
- A running [Permify](https://github.com/Permify/permify) instance

:::tip Quick Permify Setup
Run Permify locally with Docker:
```bash
docker run -p 3476:3476 -p 3478:3478 ghcr.io/permify/permify serve
```
Port `3478` is the gRPC endpoint used by the toolkit.
:::

## 1. Install

```bash
# Core client + schema DSL
pnpm add @permify-toolkit/core

# NestJS integration (if using NestJS)
pnpm add @permify-toolkit/nestjs

# CLI (dev dependency)
pnpm add -D @permify-toolkit/cli
```

## 2. Define Your Schema

Create a `permify.config.ts` in your project root:

```typescript
import {
  defineConfig,
  schema,
  entity,
  relation,
  permission
} from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({
    user: entity({}),
    document: entity({
      relations: { owner: relation("user") },
      permissions: { edit: permission("owner"), view: permission("owner") }
    })
  })
});
```

## 3. Push Schema with the CLI

```bash
permify-toolkit schema push
```

Optionally seed relationships:

```bash
permify-toolkit relationships seed --file-path ./data/relationships.json
```

## 4. Check Permissions (Standalone)

```typescript
import { createPermifyClient, checkPermission } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "localhost:3478",
  insecure: true
});

const { allowed } = await checkPermission(client, {
  tenantId: "t1",
  entity: { type: "document", id: "doc-1" },
  permission: "view",
  subject: { type: "user", id: "user-123" }
});

console.log(allowed); // true or false
```

## 5. Use in NestJS

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";

@Module({
  imports: [
    PermifyModule.forRoot({
      configFile: true,
      resolvers: {
        subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
      }
    })
  ]
})
export class AppModule {}
```

```typescript
// documents.controller.ts
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { PermifyGuard, CheckPermission } from "@permify-toolkit/nestjs";

@Controller("documents")
export class DocumentsController {
  @Get(":id")
  @UseGuards(PermifyGuard)
  @CheckPermission("document.view")
  findOne(@Param("id") id: string) {
    return { id };
  }
}
```

## Next Steps

- [Configuration](/docs/configuration) — learn about all config options and environment variables
- [Core Package](/docs/packages/core) — schema DSL, client factory, and helpers
- [NestJS Package](/docs/packages/nestjs) — module, guard, and decorators
- [CLI Package](/docs/packages/cli) — all CLI commands and flags
