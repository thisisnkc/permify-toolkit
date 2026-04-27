<p align="center">
  <img src="./eagle_logo_hd.png" width="180" alt="Permify Toolkit" />
</p>

<h1 align="center">permify-toolkit</h1>

<p align="center">
  A friendlier TypeScript wrapper around <a href="https://github.com/Permify/permify">Permify</a>. <br/>
  Schema as code, a NestJS module that gets out of your way, and a CLI for the boring parts.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@permify-toolkit/core"><img src="https://img.shields.io/npm/v/@permify-toolkit/core?label=%40permify-toolkit%2Fcore" alt="core" /></a>
  <a href="https://www.npmjs.com/package/@permify-toolkit/cli"><img src="https://img.shields.io/npm/v/@permify-toolkit/cli?label=%40permify-toolkit%2Fcli" alt="cli" /></a>
  <a href="https://www.npmjs.com/package/@permify-toolkit/nestjs"><img src="https://img.shields.io/npm/v/@permify-toolkit/nestjs?label=%40permify-toolkit%2Fnestjs" alt="nestjs" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/thisisnkc/permify-toolkit" alt="license" /></a>
  <a href="https://github.com/thisisnkc/permify-toolkit/actions/workflows/ci.yml"><img src="https://github.com/thisisnkc/permify-toolkit/actions/workflows/ci.yml/badge.svg" alt="ci" /></a>
  <a href="https://www.npmjs.com/package/@permify-toolkit/core"><img src="https://img.shields.io/npm/dm/@permify-toolkit/core?label=core%20downloads" alt="downloads" /></a>
</p>

## Why this exists

Permify is great, but using it from a [Node.js](https://github.com/nodejs/node) app with [Permify node client](https://github.com/Permify/permify-node) often ends up being more work than it should be.

In most of my [NestJS](https://github.com/nestjs/nest) projects, I kept writing the same setup again and again: wiring the client, keeping a separate `.perm` file, and maintaining small scripts to push schemas and seed data. The configuration between the app and those scripts would eventually drift, and fixing that was always annoying.

**permify-toolkit** is what I wish I had from the start. It keeps the schema in [TypeScript](https://github.com/microsoft/TypeScript), uses a single config for both the app and the CLI, and removes the need for custom scripts.

If it saves you an afternoon, that's the whole point. PRs and bug reports are welcome.

## Documentation

Read the complete documentation at [thisisnkc.github.io/permify-toolkit](https://thisisnkc.github.io/permify-toolkit).

## What's in the box

`permify-toolkit` is a small monorepo of three packages:

| Package                                      | What it does                                                                                                     |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`@permify-toolkit/core`](packages/core)     | The schema DSL, a typed Permify client, and a shared config loader. Use this on its own if you don't use NestJS. |
| [`@permify-toolkit/nestjs`](packages/nestjs) | A NestJS module, a guard, and a `@CheckPermission()` decorator with AND/OR logic.                                |
| [`@permify-toolkit/cli`](packages/cli)       | `permify-toolkit schema push`, relationship seeding, and a few other chores.                                     |

You can pick and choose. The CLI and NestJS module both read the same `permify.config.ts`, so there's no duplication between dev workflow and runtime.

## Install

```bash
pnpm add @permify-toolkit/core
pnpm add @permify-toolkit/nestjs
pnpm add -D @permify-toolkit/cli
```

`npm` and `yarn` are also supported.

## Five-minute tour

**1. Write your schema in TypeScript, not in a `.perm` file. (although you can use `.perm` files too)**

```ts
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
      permissions: {
        edit: permission("owner"),
        view: permission("owner")
      }
    })
  })
});
```

**2. Push it to Permify with CLI.**

```bash
permify-toolkit schema push
permify-toolkit relationships seed --file-path ./data/relationships.json
```

**3. Wire it into NestJS.**

```ts
// app.module.ts
PermifyModule.forRoot({
  configFile: true,
  resolvers: {
    subject: (ctx) => ctx.switchToHttp().getRequest().user?.id
  }
});
```

```ts
// documents.controller.ts
@Get(":id")
@CheckPermission({
  resource: "document",
  action: "view",
  resourceId: (req) => req.params.id,
})
findOne(@Param("id") id: string) {
  return this.documentsService.findOne(id);
}
```

That's the whole loop. Define, push, decorate.

## Connecting to Permify

The most flexible way is environment variables, which `clientOptionsFromEnv()` reads for you:

```ts
import {
  createPermifyClient,
  clientOptionsFromEnv
} from "@permify-toolkit/core";

const client = createPermifyClient(clientOptionsFromEnv());
```

It looks for `PERMIFY_ENDPOINT`, `PERMIFY_INSECURE`, `PERMIFY_TLS_CERT`, `PERMIFY_TLS_KEY`, `PERMIFY_TLS_CA`, and `PERMIFY_AUTH_TOKEN`. If you'd rather use a different prefix (say, your app name), pass it: `clientOptionsFromEnv("MY_APP_")`.

If you'd rather pass options directly:

```ts
import * as fs from "node:fs";
import { createPermifyClient } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "permify.internal:3478",
  insecure: false,
  tls: {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"),
    ca: fs.readFileSync("ca.pem")
  },
  interceptor: { authToken: process.env.PERMIFY_AUTH_TOKEN },
  timeoutMs: 60_000
});
```

## Tests

```bash
pnpm test
```

There are a few helpers if you want to drill in:

```bash
pnpm test:file client.spec.ts
pnpm test:group "Client Creation"
pnpm test:grep "should create a client"
```

## Roadmap and ideas

You can check the [roadmap](https://thisisnkc.github.io/permify-toolkit/docs/roadmap) for what’s coming next. If you have an idea, open an [issue](https://github.com/thisisnkc/permify-toolkit/issues) or start a [discussion](https://github.com/thisisnkc/permify-toolkit/discussions).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. Short version: be kind, keep changes focused, and run `pnpm lint && pnpm test` first.

## License

MIT, see [LICENSE](LICENSE).

---

If `permify-toolkit` saves you time, please ⭐ [the repo](https://github.com/thisisnkc/permify-toolkit). It helps others find it.

Made with ❤️ by [Nikhil (thisisnkc)](https://github.com/thisisnkc).
