# @permify-toolkit/nestjs

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/nestjs)](https://www.npmjs.com/package/@permify-toolkit/nestjs)
[![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit)](https://github.com/thisisnkc/permify-toolkit/blob/main/LICENSE)

NestJS module, guard, and decorators for [Permify](https://github.com/Permify/permify) authorization.

## Installation

```bash
pnpm add @permify-toolkit/nestjs @permify-toolkit/core
```

## Quick Example

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

## Features

- **Flexible Configuration** — `permify.config.ts`, config objects, or direct client options
- **Hierarchical Resolvers** — global, controller, and route-level resolver overrides
- **Authorization Guard** — `PermifyGuard` with `@CheckPermission()` decorator
- **Multi-Permission Checks** — AND/OR evaluation for complex authorization
- **Async Config** — `forRootAsync` with dependency injection support

## Documentation

For full documentation, guides, and API reference, visit the **[Permify Toolkit Docs](https://thisisnkc.github.io/permify-toolkit/)**.
