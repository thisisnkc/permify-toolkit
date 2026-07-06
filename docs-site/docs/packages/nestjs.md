---
sidebar_position: 2
---

# @permify-toolkit/nestjs

A NestJS wrapper for Permify — drop-in module, guard, and decorators for authorization.

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/nestjs)](https://www.npmjs.com/package/@permify-toolkit/nestjs)

## Installation

```bash
pnpm add @permify-toolkit/nestjs @permify-toolkit/core
```

## Features

- **Flexible Configuration** — initialize with `permify.config.ts`, config objects, or direct client options
- **Global Configuration** — configure client and resolvers once at the module level
- **Hierarchical Resolvers** — define resolvers globally, override at controller or route level
- **Optional Tenant Resolver** — set a static tenant in config, no resolver needed
- **Authorization Guard** — `PermifyGuard` enforces permissions on routes
- **Multi-Permission Checks** — AND/OR logic for complex authorization
- **Typed Permission Names** — bind `@CheckPermission` to your schema DSL so invalid names fail at compile time

## Module Setup

Import `PermifyModule` into your root `AppModule`. Three configuration methods:

### Option 1: Using `permify.config.ts` (Recommended)

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";

@Module({
  imports: [
    PermifyModule.forRoot({
      configFile: true, // Auto-loads permify.config.ts from CWD
      resolvers: {
        subject: (context) => context.switchToHttp().getRequest().user?.id
      }
    })
  ]
})
export class AppModule {}
```

Custom config path:

```typescript
PermifyModule.forRoot({
  configFile: true,
  configFilePath: "./config/permify.config.ts"
});
```

### Option 2: Importing Config Object

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import permifyConfig from "../permify.config";

@Module({
  imports: [
    PermifyModule.forRoot({
      config: permifyConfig,
      resolvers: {
        subject: (context) => context.switchToHttp().getRequest().user?.id
      }
    })
  ]
})
export class AppModule {}
```

### Option 3: Direct Client Options

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import { clientOptionsFromEnv } from "@permify-toolkit/core";

@Module({
  imports: [
    PermifyModule.forRoot({
      client: clientOptionsFromEnv(),
      resolvers: {
        tenant: (context) =>
          context.switchToHttp().getRequest().headers["x-tenant-id"],
        subject: (context) => context.switchToHttp().getRequest().user?.id
      }
    })
  ]
})
export class AppModule {}
```

**Precedence:** `config` > `configFile` > `client`

### Async Configuration

Use `forRootAsync` to inject dependencies like `ConfigService`:

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PermifyModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        client: {
          endpoint: config.get<string>("PERMIFY_ENDPOINT"),
          insecure: config.get<boolean>("PERMIFY_INSECURE", true),
          interceptor: {
            authToken: config.get<string>("PERMIFY_AUTH_TOKEN")
          }
        },
        resolvers: {
          tenant: (ctx) =>
            ctx.switchToHttp().getRequest().headers["x-tenant-id"],
          subject: (ctx) => ctx.switchToHttp().getRequest().user?.id,
          resource: (ctx) => ctx.switchToHttp().getRequest().params.id
        }
      })
    })
  ]
})
export class AppModule {}
```

## Tenant Resolution

The tenant resolver is **optional** when tenant is set in your config.

**Resolution order:**

1. Route-level `@PermifyResolvers({ tenant: ... })` override
2. Controller-level `@PermifyResolvers({ tenant: ... })` override
3. Global `resolvers.tenant` function in `forRoot`
4. `tenant` field from `permify.config.ts` (static fallback)
5. Error if none provides a tenant

For single-tenant apps, set tenant once in your config:

```typescript
// permify.config.ts
export default defineConfig({
  tenant: "my-tenant",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({ ... })
});

// app.module.ts — no tenant resolver needed
PermifyModule.forRoot({
  configFile: true,
  resolvers: {
    subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
  }
})
```

## Hierarchical Resolvers

Resolvers follow strict precedence:

1. **Route Level** (Highest Priority)
2. **Controller Level**
3. **Global Level**
4. **Config** (Lowest Priority, tenant only)

Use the `@PermifyResolvers` decorator to override at any level:

```typescript
import { Controller, Get } from "@nestjs/common";
import { PermifyResolvers } from "@permify-toolkit/nestjs";

@PermifyResolvers({
  tenant: () => "controller-tenant-id",
  resource: (ctx) => "controller-resource",
  metadata: (ctx) => ({
    depth: 20,
    schemaVersion: "v1"
  })
})
@Controller("cats")
export class CatsController {
  @Get()
  findAll() {
    // Uses controller-level resolvers
  }

  @PermifyResolvers({
    tenant: () => "route-tenant-id",
    subject: () => "route-subject-id",
    resource: (ctx) => "route-resource",
    metadata: (ctx) => ({
      snapToken: ctx.switchToHttp().getRequest().headers["x-snap-token"],
      depth: 5
    })
  })
  @Get("specific")
  findSpecific() {
    // Uses route-level overrides
  }
}
```

:::info
There is no merging between levels. If you override at a level, you replace the resolution logic for that scope. Missing resolvers fall back to the next level.
:::

## Authorization Guard

### Basic Usage

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  PermifyGuard,
  CheckPermission,
  PermifyResolvers
} from "@permify-toolkit/nestjs";

@PermifyResolvers({
  subject: (ctx) => ctx.switchToHttp().getRequest().user?.id,
  resource: (ctx) => ctx.switchToHttp().getRequest().params.id
})
@Controller("documents")
export class DocumentsController {
  @UseGuards(PermifyGuard)
  @CheckPermission("document.view")
  @Get(":id")
  view() {
    return "You have access!";
  }
}
```

### Multi-Permission Checks

The `@CheckPermission` decorator supports multiple permissions:

```typescript
// Single permission
@CheckPermission("document.view")

// AND mode (default) — ALL must pass
@CheckPermission(["document.view", "document.edit"])

// OR mode — at least ONE must pass
@CheckPermission(["document.view", "document.edit"], { mode: "OR" })
```

### Typed Permission Names

`@CheckPermission` accepts any string. If your schema is defined with the core DSL (see [`schema()`](./core.md#type-safe-schema-dsl)), you can bind the decorator to it with `createPermifyDecorators` — then only names that exist in the schema compile, and your editor autocompletes them.

```typescript
// auth.ts — bind once, re-export
import { createPermifyDecorators } from "@permify-toolkit/nestjs";
import { appSchema } from "./permify.config";

export const { CheckPermission } = createPermifyDecorators<typeof appSchema>();
```

```typescript
// documents.controller.ts
import { CheckPermission } from "./auth";

@CheckPermission("document.edit")               // ✅ compiles
@CheckPermission(["document.view", "edit"])     // ✅ qualified and bare forms both work
@CheckPermission("document.rename")             // ❌ compile error — not in the schema
```

Both permissions and relations are accepted, in qualified (`"document.edit"`) and bare (`"edit"`) form the same set the guard resolves at runtime. Options like `{ mode: "OR" }` work identically to the untyped decorator.

:::info
Typed names require a DSL-defined schema. If you use `schemaFile()` with a `.perm` file, keep using the untyped `@CheckPermission` or mirror the schema in the DSL to get typing (see the [simulator](https://github.com/thisisnkc/permify-toolkit/blob/main/simulator/backend/src/auth.ts) for an example).
:::

### How the Guard Works

1. Resolves **Tenant**, **Subject**, and **Resource** from configured resolvers
2. Evaluates permissions concurrently using AND/OR mode
3. Passes `{ depth: 20 }` as default metadata if none is configured
4. Throws `ForbiddenException` with a descriptive message on failure

## Accessing Permission Results

When a route has multiple permissions checked with OR mode, you often need to know _which_ ones passed, to conditionally include data, set flags, or write audit logs. `@PermissionResult()` injects the guard's results directly into the handler, with no second round-trip to Permify.

```typescript
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import {
  CheckPermission,
  PermifyGuard,
  PermissionResult,
  type PermissionCheckResult
} from "@permify-toolkit/nestjs";

@Controller("documents")
@UseGuards(PermifyGuard)
export class DocumentsController {
  @Get(":id")
  @CheckPermission(["document.view", "document.edit"], { mode: "OR" })
  async getDocument(
    @Param("id") id: string,
    @PermissionResult() permissions: PermissionCheckResult[]
  ) {
    const canEdit = permissions.find((p) => p.permission === "edit")?.allowed;

    return {
      document: await this.documentService.findOne(id),
      editable: canEdit ?? false // surface to frontend — no second gRPC call
    };
  }
}
```

`PermissionCheckResult` is:

```typescript
interface PermissionCheckResult {
  permission: string; // e.g. "view", "edit"
  allowed: boolean;
}
```

:::info
`@PermissionResult()` requires `PermifyGuard` to have already run on the route. It returns `[]` on public routes where no guard ran.
:::

**Common uses:**

- OR-mode checks where you need to know which permission was granted (e.g. `admin` vs `editor` to shape the response)
- Returning permission flags alongside resource data so the frontend doesn't need a separate permissions call
- Audit logging which permissions were checked and what the outcome was

## API Reference

### Exports

| Export                      | Description                                                       |
| --------------------------- | ----------------------------------------------------------------- |
| `PermifyModule`             | NestJS dynamic module (`forRoot` / `forRootAsync`)                |
| `PermifyService`            | Injectable service for manual permission checks                   |
| `PermifyGuard`              | Route guard implementing `CanActivate`                            |
| `@CheckPermission()`        | Decorator to specify required permissions                         |
| `@PermifyResolvers()`       | Decorator to override resolvers per controller/route              |
| `@PermissionResult()`       | Param decorator to inject guard's check results                   |
| `PermissionCheckResult`     | Type for each entry in the results array                          |
| `createPermifyDecorators()` | Create a `@CheckPermission` typed against a schema DSL definition |
