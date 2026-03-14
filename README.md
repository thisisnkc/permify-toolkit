<p align="center">
  <img src="https://i.ibb.co/6cKWNj9P/eagle-logo-hd.png" width="300" alt="Permify Toolkit Logo" />
</p>

# Permify Toolkit

<p align="center">The TypeScript toolkit for <a href="https://github.com/Permify/permify" target="_blank">Permify</a> with type-safe schema DSL, NestJS integration, and CLI for fine-grained authorization.</p>

<p align="center">
<a href="https://www.npmjs.com/package/@permify-toolkit/core" target="_blank"><img src="https://img.shields.io/npm/v/@permify-toolkit/core?label=%40permify-toolkit%2Fcore" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@permify-toolkit/cli" target="_blank"><img src="https://img.shields.io/npm/v/@permify-toolkit/cli?label=%40permify-toolkit%2Fcli" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/@permify-toolkit/nestjs" target="_blank"><img src="https://img.shields.io/npm/v/@permify-toolkit/nestjs?label=%40permify-toolkit%2Fnestjs" alt="NPM Version" /></a>
<a href="LICENSE" target="_blank"><img src="https://img.shields.io/github/license/thisisnkc/permify-toolkit" alt="Package License" /></a>
<a href="https://github.com/thisisnkc/permify-toolkit/actions/workflows/ci.yml" target="_blank"><img src="https://github.com/thisisnkc/permify-toolkit/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<a href="https://www.npmjs.com/package/@permify-toolkit/core" target="_blank"><img src="https://img.shields.io/npm/dm/@permify-toolkit/core?label=core%20downloads" alt="NPM Downloads" /></a>
</p>

<p align="center">
  <a href="https://github.com/thisisnkc/permify-toolkit/issues" target="_blank">Report Bug</a>
  ·
  <a href="https://github.com/Permify/permify" target="_blank">Permify</a>
</p>

> If permify-toolkit saves you time, please ⭐ star this repo, it helps others discover it!

---

## Why Permify Toolkit?

Working with Permify's gRPC API directly is verbose. Permify Toolkit wraps it in a clean, type-safe TypeScript API so you can focus on your authorization model, not the plumbing:

- **Zero gRPC boilerplate** — connect with a single function call or environment variables
- **Type-safe schema DSL** — define entities, relations, and permissions in TypeScript with full autocompletion
- **One config file** — `permify.config.ts` is shared between your NestJS app and CLI; no duplication
- **NestJS-first** — drop-in module, `@CheckPermission()` decorator, and guard with multi-permission AND/OR logic
- **CLI included** — push schemas and seed relationships without writing scripts

---

## Packages

This monorepo publishes three focused packages:

| Package                                      | Install                            | Purpose                                   |
| -------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| [`@permify-toolkit/core`](packages/core)     | `pnpm add @permify-toolkit/core`   | Schema DSL, client factory, shared config |
| [`@permify-toolkit/nestjs`](packages/nestjs) | `pnpm add @permify-toolkit/nestjs` | NestJS module, guard, decorators          |
| [`@permify-toolkit/cli`](packages/cli)       | `pnpm add -D @permify-toolkit/cli` | Schema push, relationship seeding         |

---

## Quick Start

### 1. Install

```bash
# Core client + schema DSL
pnpm add @permify-toolkit/core

# NestJS integration
pnpm add @permify-toolkit/nestjs

# CLI (dev dependency)
pnpm add -D @permify-toolkit/cli
```

### 2. Define your schema in `permify.config.ts`

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

### 3. Push schema with the CLI

```bash
permify-toolkit schema push
permify-toolkit relationships seed --file-path ./data/relationships.json
```

### 4. Use in NestJS

```typescript
// app.module.ts
PermifyModule.forRoot({
  configFile: true,
  resolvers: {
    subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
  }
});

// documents.controller.ts
@Get(':id')
@CheckPermission({ resource: 'document', action: 'view', resourceId: (req) => req.params.id })
findOne(@Param('id') id: string) {
  return this.documentsService.findOne(id);
}
```

---

## Usage

### Creating a Permify Client

The toolkit offers flexible ways to connect to your Permify instance.

#### Option 1: Environment Variables (Recommended)

```typescript
import {
  createPermifyClient,
  clientOptionsFromEnv
} from "@permify-toolkit/core";

// Reads from PERMIFY_ENDPOINT, PERMIFY_INSECURE, PERMIFY_TLS_CERT, etc.
const client = createPermifyClient(clientOptionsFromEnv());
```

**Supported environment variables:**

- `PERMIFY_ENDPOINT` - Permify server endpoint (e.g., `localhost:3478`)
- `PERMIFY_INSECURE` - Use insecure connection (`true`/`false`)
- `PERMIFY_TLS_CERT` - Path to TLS certificate file
- `PERMIFY_TLS_KEY` - Path to TLS key file
- `PERMIFY_TLS_CA` - Path to CA certificate file
- `PERMIFY_AUTH_TOKEN` - Permify access token (when using interceptor)

You can also use a custom prefix:

```typescript
// Reads from MY_APP_ENDPOINT, MY_APP_INSECURE, etc.
const client = createPermifyClient(clientOptionsFromEnv("MY_APP_"));
```

#### Option 2: Manual Configuration

```typescript
import * as fs from "fs";
import { createPermifyClient } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "permify.internal:3478",
  insecure: false,
  tls: {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"),
    ca: fs.readFileSync("ca.pem")
  },
  interceptor: { authToken: "YOUR_TOKEN" },
  timeoutMs: 60000
});
```

### Shared Configuration with `permify.config.ts`

Define your connection, schema, and tenant once in `permify.config.ts` and share it across CLI and NestJS:

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
    document: entity({
      relations: { owner: relation("user") },
      permissions: { edit: permission("owner") }
    })
  })
});
```

Then use it in your NestJS app — no client duplication, no env redefinition:

```typescript
PermifyModule.forRoot({
  configFile: true,
  resolvers: {
    subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
  }
});
```

And with the CLI (tenant from config, no flag needed):

```bash
permify-toolkit schema push
permify-toolkit relationships seed --file-path ./data/relationships.json
```

See the individual package READMEs for full documentation.

### Running Tests

```bash
pnpm test
```

#### Running Specific Tests

To run specific tests, you can use the helper scripts in `packages/core` _(currently tests are only in core, PRs are welcome adding more tests for rest packages)_:

```bash
# Run a specific file
pnpm test:file client.spec.ts

# Run a specific test group
pnpm test:group "Client Creation"

# Run tests matching a title
pnpm test:grep "should create a client"
```

Alternatively, you can pass arguments directly to `pnpm test`:

```bash
pnpm test -- --files client.spec.ts
```

---

## Roadmap

We're actively working on expanding the toolkit. Here's what's coming:

- [x] Authorization guards for NestJS package
- [x] Full-stack example app (frontend + NestJS backend)
- [x] Release v1.0.0 and publish to npm
- [x] Multi permission checks (AND + OR logic)
- [ ] Docs
- [ ] Testing utilities — mock Permify client and test helpers for unit testing authorization logic
- [ ] Permission result caching — in-memory (and optionally Redis-backed) cache to reduce gRPC round-trips
- [ ] Schema validation CLI command — lint and validate schema syntax before pushing to Permify
- [ ] Relationship query CLI commands — list, inspect, and export existing relationships from a tenant
- [ ] Express.js / Fastify middleware — permission-check middleware for non-NestJS backends
- [ ] GraphQL support — `@CheckPermission` directive and guards for NestJS GraphQL resolvers
- [ ] ABAC helpers — high-level utilities for attribute-based access control rules
- [ ] OpenTelemetry tracing — structured spans and metrics for permission checks and schema operations
- [ ] Schema diff CLI command — preview what will change before pushing a schema update
- [ ] Multi-tenant CLI management — create, list, and delete tenants directly from the CLI

Have ideas? [Open an issue](https://github.com/thisisnkc/permify-toolkit/issues) or start a [discussion](https://github.com/thisisnkc/permify-toolkit/discussions)!

---

## Contributing

We love contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is welcome.

Please see our [Contributing Guidelines](CONTRIBUTING.md) for:

- Code of conduct
- Development workflow
- How to submit PRs
- Testing requirements

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with ❤️ by Nikhil Kumar Choudhary aka [thisisnkc](https://github.com/thisisnkc) for the [Permify](https://github.com/Permify/permify) community.

If you find this toolkit helpful, please consider:

- ⭐ **[Starring the repo](https://github.com/thisisnkc/permify-toolkit)**, it helps others discover permify-toolkit
- Reporting bugs
- Suggesting features
- Improving documentation
- Adding more tests

---

**Questions?** Open an issue or reach out to the maintainers. We're here to help!
