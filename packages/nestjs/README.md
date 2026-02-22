# @permify-toolkit/nestjs

A NestJS wrapper for Permify, providing easy integration for authorization in your NestJS applications.

## Features

- **Flexible Configuration**: Initialize with `permify.config.ts`, imported config objects, or direct client options.
- **Global Configuration**: Configure Permify client and resolvers once at the module level.
- **Hierarchical Resolvers**: Define tenant and subject resolvers globally, and override them at the Controller or Route level.
- **Optional Tenant Resolver**: Set a static tenant in `permify.config.ts` — no resolver needed.
- **Authorization Guard**: Use `PermifyGuard` to enforce permissions on your routes.

## Getting Started

### 1. Import the Module

Import `PermifyModule` into your root `AppModule`. There are three ways to configure it:

#### Option 1: Using `permify.config.ts` (Recommended)

The simplest approach — reuse your existing `permify.config.ts` with zero duplication:

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";

@Module({
  imports: [
    PermifyModule.forRoot({
      configFile: true, // Auto-loads permify.config.ts from CWD
      resolvers: {
        // Tenant resolver is optional if tenant is set in permify.config.ts
        subject: (context) => context.switchToHttp().getRequest().user?.id
      }
    })
  ]
})
export class AppModule {}
```

You can also specify a custom config file path:

```typescript
PermifyModule.forRoot({
  configFile: true,
  configFilePath: "./config/permify.config.ts"
});
```

#### Option 2: Importing Config Object

For explicit control, import your config directly:

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

#### Option 3: Direct Client Options

For manual control or when not using `permify.config.ts`:

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import { clientOptionsFromEnv } from "@permify-toolkit/core";

@Module({
  imports: [
    PermifyModule.forRoot({
      client: clientOptionsFromEnv(), // or manual { endpoint, insecure, ... }
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

#### Asynchronous Configuration

Use `forRootAsync` to inject configuration dependencies, such as `ConfigService`.

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
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

The `tenant` resolver is **optional** when tenant is provided via config:

**Resolution order:**

1. Route-level `@PermifyResolvers({ tenant: ... })` override
2. Controller-level `@PermifyResolvers({ tenant: ... })` override
3. Global `resolvers.tenant` function in `forRoot`
4. `tenant` field from `permify.config.ts` (static fallback)
5. Error if none of the above provides a tenant

This means for single-tenant apps, you can set tenant once in your config:

```typescript
// permify.config.ts
export default defineConfig({
  tenant: "my-tenant",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schema({ ... })
});

// app.module.ts — no tenant resolver needed!
PermifyModule.forRoot({
  configFile: true,
  resolvers: {
    subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
  }
})
```

## Hierarchical Resolvers

This package supports a hierarchical resolver model with strict precedence:

1.  **Route Level** (Highest Priority)
2.  **Controller Level**
3.  **Global Level**
4.  **Config** (Lowest Priority, tenant only)

If a resolver is defined at the Route level, it overrides both Controller and Global resolvers. If defined at the Controller level, it overrides Global.

**Note:** There is no merging of partial configurations between levels. If you override at a level, you replace the resolution logic for that scope. However, if a specific resolver (e.g., `tenant`) is missing at the overriding level, it falls back to the Global definition, then to config.

### Using `@PermifyResolvers`

You can use the `@PermifyResolvers` decorator to override resolvers (`tenant`, `subject`, `resource`, and `metadata`) for specific Controllers or Routes.

This allows you to customize not just the entities involved in the permission check, but also the metadata passed to the Permify client (e.g., `snapToken`, `schemaVersion`, `depth`).

```typescript
import { Controller, Get } from "@nestjs/common";
import { PermifyResolvers } from "@permify-toolkit/nestjs";

@PermifyResolvers({
  tenant: () => "controller-tenant-id", // Overrides global tenant
  resource: (ctx) => "controller-resource",
  // Define metadata for all routes in this controller
  metadata: (ctx) => ({
    depth: 20,
    schemaVersion: "v1"
  })
})
@Controller("cats")
export class CatsController {
  @Get()
  findAll() {
    // Uses 'controller-tenant-id', global subject, and controller metadata
  }

  @PermifyResolvers({
    tenant: () => "route-tenant-id", // Overrides controller tenant
    subject: () => "route-subject-id", // Overrides global subject
    resource: (ctx) => "route-resource",
    // Override metadata for this specific route
    metadata: (ctx) => ({
      snapToken: ctx.switchToHttp().getRequest().headers["x-snap-token"],
      depth: 5 // Overrides controller depth
    })
  })
  @Get("specific")
  findSpecific() {
    // Uses 'route-tenant-id', 'route-subject-id', and route-specific metadata
  }
}
```

Metadata resolution follows the same precedence: **Route > Controller > Global**. This allows granular control over consistency tokens and query depth per endpoint.

## Authorization Guard

The package provides `PermifyGuard` to enforce permissions on your routes. It automatically resolves the tenant, subject, and resource from the context and checks permissions against Permify.

### Usage

1.  **Register the Guard**: You can register it globally or per-route.
2.  **Decorate Routes**: Use `@CheckPermission` to specify the required permission.

suppose this is your schema:

```typescript
schema({
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
});
```

then the controller will be:

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  PermifyGuard,
  CheckPermission,
  PermifyResolvers
} from "@permify-toolkit/nestjs";

// supposing tenant resolver is defined in the global configuration
@PermifyResolvers({
  subject: (ctx) => ctx.switchToHttp().getRequest().user?.id,
  resource: (ctx) => ctx.params.id
})
// this could also be written as:
// @PermifyResolvers({
//   subject: { type: "user", id: "user-id" },
//   resource: { type: "document", id: "doc-id" }
// })
@Controller("documents")
export class DocumentsController {
  @UseGuards(PermifyGuard)
  // the permission is checked against the resolved resource that is defined in
  // the schema, as per the schema above, the document entity has view and edit
  // permissions, and this guard will allow access only if the subject has viewer
  // or owner relation on the resolved resource
  @CheckPermission("document.view")
  @Get(":id")
  view() {
    return "You have access!";
  }
}
```

The guard will:

1.  Resolve the **Tenant**, **Subject**, and **Resource** using your configured resolvers (or config fallback for tenant).
2.  Check if the **Subject** has `document.view` permission on the resolved **Resource**.
3.  Pass an empty `metadata` object (`{}`) if no metadata resolver is defined (required by the Permify Node client).
4.  Throw a `ForbiddenException` if permission is denied or if the resource cannot be resolved.
