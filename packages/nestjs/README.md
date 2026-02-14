# @permify-toolkit/nestjs

A NestJS wrapper for Permify, providing easy integration for authorization in your NestJS applications.

## Features

- **Global Configuration**: Configure Permify client and resolvers once at the module level.
- **Hierarchical Resolvers**: Define tenant and subject resolvers globally, and override them at the Controller or Route level.
- **Dependency Injection**: Inject `PermifyService` to access the Permify client anywhere in your app.

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
          subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
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

You can use the `@PermifyResolvers` decorator to override resolvers for specific Controllers or Routes.

```typescript
import { Controller, Get } from "@nestjs/common";
import { PermifyResolvers } from "@permify-toolkit/nestjs";

@PermifyResolvers({
  tenant: () => "controller-tenant-id" // Overrides global tenant for all methods in this controller
})
@Controller("cats")
export class CatsController {
  @Get()
  findAll() {
    // Uses 'controller-tenant-id' and global subject resolver
  }

  @PermifyResolvers({
    tenant: () => "route-tenant-id", // Overrides controller tenant for this method
    subject: () => "route-subject-id" // Overrides global subject for this method
  })
  @Get("specific")
  findSpecific() {
    // Uses 'route-tenant-id' and 'route-subject-id'
  }
}
```
