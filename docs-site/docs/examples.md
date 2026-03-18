---
sidebar_position: 6
---

# Examples

## Simulator App

The repository includes a full-stack reference implementation in the `simulator/` directory — a NestJS backend with a frontend UI demonstrating real-world authorization patterns.

### Architecture

```
simulator/
├── backend/          # NestJS app using @permify-toolkit/nestjs
│   ├── permify.config.ts
│   ├── relationships.json
│   └── src/
└── frontend/         # Static frontend UI
    └── index.html
```

### Backend Setup

The simulator backend demonstrates multi-tenant authorization with the toolkit:

```typescript
// permify.config.ts
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
    organization: entity({
      relations: { member: relation("user") },
      permissions: { view: permission("member") }
    }),
    document: entity({
      relations: {
        owner: relation("user"),
        parent: relation("organization")
      },
      permissions: {
        view: permission("owner or parent.view"),
        edit: permission("owner")
      }
    })
  })
});
```

### Running the Simulator

```bash
# From the simulator/backend directory
pnpm install
pnpm schema:push        # Push schema to Permify
pnpm start:dev          # Start NestJS in dev mode
```

### Environment Variables

The simulator uses these environment variables (with defaults):

| Variable | Default |
| --- | --- |
| `PERMIFY_ENDPOINT` | `localhost:3478` |
| `PERMIFY_INSECURE` | `true` |

## Minimal Example

Here's the smallest possible setup to check permissions:

```typescript
import {
  createPermifyClient,
  checkPermission
} from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "localhost:3478",
  insecure: true
});

const result = await checkPermission(client, {
  tenantId: "t1",
  entity: { type: "document", id: "1" },
  permission: "view",
  subject: { type: "user", id: "alice" }
});

if (result.allowed) {
  console.log("Access granted");
}
```

## NestJS Full Example

A complete NestJS app with authorization:

```typescript
// permify.config.ts
import { defineConfig, schema, entity, relation, permission } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({
    user: entity({}),
    document: entity({
      relations: {
        owner: relation("user"),
        viewer: relation("user")
      },
      permissions: {
        view: permission("viewer or owner"),
        edit: permission("owner")
      }
    })
  })
});
```

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import { DocumentsModule } from "./documents/documents.module";

@Module({
  imports: [
    PermifyModule.forRoot({
      configFile: true,
      resolvers: {
        subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
      }
    }),
    DocumentsModule
  ]
})
export class AppModule {}
```

```typescript
// documents.controller.ts
import { Controller, Get, Post, Param, UseGuards } from "@nestjs/common";
import {
  PermifyGuard,
  CheckPermission,
  PermifyResolvers
} from "@permify-toolkit/nestjs";

@PermifyResolvers({
  resource: (ctx) => ctx.switchToHttp().getRequest().params.id
})
@Controller("documents")
export class DocumentsController {
  @Get(":id")
  @UseGuards(PermifyGuard)
  @CheckPermission("document.view")
  findOne(@Param("id") id: string) {
    return { id, title: "My Document" };
  }

  @Post(":id/edit")
  @UseGuards(PermifyGuard)
  @CheckPermission("document.edit")
  edit(@Param("id") id: string) {
    return { id, updated: true };
  }

  @Get(":id/admin")
  @UseGuards(PermifyGuard)
  @CheckPermission(["document.view", "document.edit"])
  admin(@Param("id") id: string) {
    return { id, isAdmin: true };
  }
}
```
