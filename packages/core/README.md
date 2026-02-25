# @permify-toolkit/core

![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit)
![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/core)

The core engine of the Permify Toolkit. This package is designed to be the ultimate TypeScript interface for [Permify](https://github.com/Permify/permify).

## Why use `@permify-toolkit/core`?

While the official `@permify/permify-node` provides the raw gRPC client, `@permify-toolkit/core` is built for **productivity, type-safety, and shared configuration**.

### Better than the standard client:

- **Type-Safe Schema DSL**: Stop writing schemas as raw strings. Use our fluent API to define entities and relations with full IDE autocomplete.
- **Developer Ergonomics**: Common operations like `checkPermission` or `writeRelationships` are simplified into single-function calls, handling the boilerplate for you.
- **Environment-First**: Native support for environment variable configuration with customizable prefixes.
- **Shared Configuration**: Use `permify.config.ts` once to power your application, [CLI](https://www.npmjs.com/package/@permify-toolkit/cli), and [NestJS](https://www.npmjs.com/package/@permify-toolkit/nestjs) module.

## When to use it?

1. **Standalone**: In any TypeScript project (Express, Fastify, Lambda) that needs to talk to Permify with better type safety.
2. **Infrastructure**: As the foundation for your authorization-as-code scripts.
3. **Internal Tools**: To build custom schema management or auditing tools.

---

## Installation

```bash
pnpm add @permify-toolkit/core
# or
npm install @permify-toolkit/core
```

## Features & Usage

### 1. Type-Safe Schema DSL

Define your authorization model in TypeScript. This allows you to export your schema and use its structure elsewhere in your code for end-to-end type safety.

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

### 2. High-Level Client Utilities

Skip the gRPC boilerplate. Use helpers that understand your context.

```typescript
import { createPermifyClient, checkPermission } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "localhost:3478",
  insecure: true
});

// Simple, readable permission checks
const { allowed } = await checkPermission(client, {
  tenantId: "my-tenant",
  entity: { type: "document", id: "doc-1" },
  permission: "view",
  subject: { type: "user", id: "user-123" }
});
```

### 3. Centralized Configuration

Create a `permify.config.ts` in your root. This package provides the `defineConfig` helper that makes your config compatible with:

- [@permify-toolkit/cli](https://github.com/thisisnkc/permify-toolkit/tree/main/packages/cli) - Push schemas and seed data without extra flags.
- [@permify-toolkit/nestjs](https://github.com/thisisnkc/permify-toolkit/tree/main/packages/nestjs) - Zero-setup module initialization.

```typescript
// permify.config.ts
import { defineConfig } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "my-tenant",
  client: {
    endpoint: process.env.PERMIFY_URL,
    insecure: false
  }
  // Your schema and seed data can also live here!
});
```

## Documentation

For full documentation and examples, please visit the [main repository](https://github.com/thisisnkc/permify-toolkit).
