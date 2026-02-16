# @permify-toolkit/nestjs

A NestJS wrapper for Permify, providing easy integration for authorization in your NestJS applications.

## Features

- **Global Configuration**: Configure Permify client and resolvers once at the module level.
- **Hierarchical Resolvers**: Define tenant and subject resolvers globally, and override them at the Controller or Route level.
- **Authorization Guard**: Use `PermifyGuard` to enforce permissions on your routes.

## Getting Started

### 1. Import the Module

Import `PermifyModule` into your root `AppModule`. You can configure it synchronously or asynchronously.

### 1. Import the Module

Import `PermifyModule` into your root `AppModule`. You can configure it synchronously or asynchronously.

#### Option 1: Environment Variables (Recommended)

The simplest approach uses `clientOptionsFromEnv` to load configuration from environment variables (`PERMIFY_ENDPOINT`, `PERMIFY_INSECURE`, etc.), aligning with the core client pattern.

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

#### Option 2: Manual Configuration

For more control, you can pass the client options directly.

```typescript
import { Module } from "@nestjs/common";
import { PermifyModule } from "@permify-toolkit/nestjs";
import * as fs from "fs";

@Module({
  imports: [
    PermifyModule.forRoot({
      client: {
        endpoint: "permify.internal:3478",
        insecure: false,
        tls: {
          cert: fs.readFileSync("cert.pem"),
          key: fs.readFileSync("key.pem"),
          ca: fs.readFileSync("ca.pem")
        },
        interceptor: {
          authToken: "YOUR_TOKEN"
        }
      },
      resolvers: {
        // Global Tenant Resolver (Required)
        tenant: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.headers["x-tenant-id"];
        },
        // Global Subject Resolver (Optional)
        subject: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.user?.id;
        },
        // Global Resource Resolver (Optional)
        resource: (context) => {
          const req = context.switchToHttp().getRequest();
          return req.params.id;
        }
      }
    })
  ]
})
export class AppModule {}
```

same is defined in the [Usage](https://github.com/thisisnkc/permify-toolkit/blob/main/README.md#Usage) section.

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

## Hierarchical Resolvers

This package supports a hierarchical resolver model with strict precedence:

1.  **Route Level** (Highest Permission)
2.  **Controller Level**
3.  **Global Level** (Lowest Permission)

If a resolver is defined at the Route level, it overrides both Controller and Global resolvers. If defined at the Controller level, it overrides Global.

**Note:** There is no merging of partial configurations between levels. If you override at a level, you replace the resolution logic for that scope. However, if a specific resolver (e.g., `tenant`) is missing at the overriding level, it falls back to the Global definition.

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

1.  Resolve the **Tenant**, **Subject**, and **Resource** using your configured resolvers.
2.  Check if the **Subject** has `document.view` permission on the resolved **Resource**.
3.  Throw a `ForbiddenException` if permission is denied or if the resource cannot be resolved.
