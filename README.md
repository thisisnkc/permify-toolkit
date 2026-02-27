# Permify Toolkit

![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit)
![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/core?label=%40permify-toolkit%2Fcore)
![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/cli?label=%40permify-toolkit%2Fcli)
![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/nestjs?label=%40permify-toolkit%2Fnestjs)

> A comprehensive TypeScript toolkit for building authorization systems with [Permify](https://github.com/Permify/permify)

Permify Toolkit simplifies authorization management by providing type-safe clients, CLI tools, and framework integrations, all in one place.

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Running Tests](#running-tests)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

This monorepo provides:

- **[@permify-toolkit/core](packages/core)** [![npm version](https://img.shields.io/npm/v/@permify-toolkit/core)](https://www.npmjs.com/package/@permify-toolkit/core) - Core engine: Type-safe schema DSL, simplified client, and configuration engine.
- **[@permify-toolkit/cli](packages/cli)** [![npm version](https://img.shields.io/npm/v/@permify-toolkit/cli)](https://www.npmjs.com/package/@permify-toolkit/cli) - Command-line interface for schema management and relationship seeding.
- **[@permify-toolkit/nestjs](packages/nestjs)** [![npm version](https://img.shields.io/npm/v/@permify-toolkit/nestjs)](https://www.npmjs.com/package/@permify-toolkit/nestjs) - First-class NestJS integration with decorators, guards, and module setup.

---

## Quick Start

### Prerequisites

This project uses [pnpm](https://pnpm.io/) for package management.

```bash
# Install pnpm globally
npm install -g pnpm
```

### Installation

```bash
# Clone the repository
git clone https://github.com/thisisnkc/permify-toolkit.git
cd permify-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

---

## Usage

### Creating a Permify Client

The toolkit offers flexible ways to connect to your Permify instance.

#### Option 1: Environment Variables (Recommended)

The simplest approach uses environment variables for configuration:

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

For more control, configure the client directly:

```typescript
import * as fs from "fs";
import { createPermifyClient } from "@permify-toolkit/core";

const client = createPermifyClient({
  endpoint: "permify.internal:3478",
  insecure: false, // 'insecure' defaults to false (true only for localhost endpoints)
  tls: {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem"), // originally as pk in permify node client
    ca: fs.readFileSync("ca.pem")
  },
  interceptor: {
    authToken: "YOUR_TOKEN"
  },
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

Then use it in your NestJS app:

```typescript
// No client duplication, no env redefinition
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
- [ ] Multi permission checks
- [ ] Docs

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

- Starring the repo
- Reporting bugs
- Suggesting features
- Improving documentation
- Adding more tests

---

**Questions?** Open an issue or reach out to the maintainers. We're here to help!
