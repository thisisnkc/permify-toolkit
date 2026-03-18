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

### How the Guard Works

1. Resolves **Tenant**, **Subject**, and **Resource** from configured resolvers
2. Evaluates permissions concurrently using AND/OR mode
3. Passes `{ depth: 20 }` as default metadata if none is configured
4. Throws `ForbiddenException` with a descriptive message on failure

## API Reference

### Exports

| Export                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `PermifyModule`       | NestJS dynamic module (`forRoot` / `forRootAsync`)   |
| `PermifyService`      | Injectable service for manual permission checks      |
| `PermifyGuard`        | Route guard implementing `CanActivate`               |
| `@CheckPermission()`  | Decorator to specify required permissions            |
| `@PermifyResolvers()` | Decorator to override resolvers per controller/route |
