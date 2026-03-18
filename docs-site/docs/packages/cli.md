---
sidebar_position: 3
---

# @permify-toolkit/cli

CLI for pushing schemas and seeding relationships to your Permify instance.

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/cli)](https://www.npmjs.com/package/@permify-toolkit/cli)

## Installation

```bash
pnpm add -D @permify-toolkit/cli
```

## Configuration

The CLI relies on a `permify.config.ts` file in your project root. See [Configuration](/docs/configuration) for full details.

### Schema Definition Options

#### Inline Schema (AST-based)

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
  client: {
    endpoint: "localhost:3478",
    insecure: true
  },
  schema: schema({
    user: entity({
      relations: {
        manager: relation("user")
      },
      permissions: {
        manage: permission("manager")
      }
    }),
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
  }),
  relationships: {
    seedFile: "./relationships.json",
    mode: "append"
  }
});
```

#### File-based Schema

```typescript
import { defineConfig, schemaFile } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schemaFile("./schema.perm")
});
```

## Tenant Configuration

The `--tenant` flag is **optional** if `tenant` is defined in `permify.config.ts`.

**Resolution order:**

1. `--tenant` CLI flag (or `PERMIFY_TENANT` env var)
2. `tenant` field in `permify.config.ts`
3. Error if neither is provided

## Commands

### `schema push`

Pushes the schema defined in your config to the Permify server.

```bash
permify-toolkit schema push [--tenant <tenant-id>] [flags]
```

**Flags:**

| Flag | Alias | Description | Default |
| --- | --- | --- | --- |
| `--tenant` | | Tenant ID to push to | From config |
| `--create-tenant` | `-c` | Create tenant if it doesn't exist | `false` |

**Examples:**

```bash
# Push using tenant from config
permify-toolkit schema push

# Push to a specific tenant
permify-toolkit schema push --tenant my-tenant-id

# Push and create tenant if needed
permify-toolkit schema push --tenant new-tenant-id --create-tenant
```

**Schema Validation:**

The Permify server validates your schema on push. If there are errors, you'll see a detailed message:

```
Error: Entity "usr" referenced in relation "document.owner" does not exist
```

### `relationships seed`

Seeds relationship data from a JSON file.

```bash
permify-toolkit relationships seed [--tenant <id>] [--file-path <path>] [flags]
```

**Flags:**

| Flag | Alias | Description | Default |
| --- | --- | --- | --- |
| `--tenant` | | Tenant ID to seed to | From config |
| `--file-path` | `-f` | Path to JSON file with tuples | From config |
| `--create-tenant` | `-c` | Create tenant if it doesn't exist | `false` |

**Example `relationships.json`:**

```json
{
  "tuples": [
    {
      "entity": { "type": "organization", "id": "org_1" },
      "relation": "member",
      "subject": { "type": "user", "id": "alice" }
    },
    {
      "entity": { "type": "document", "id": "doc_1" },
      "relation": "owner",
      "subject": { "type": "user", "id": "bob" }
    },
    {
      "entity": { "type": "document", "id": "doc_1" },
      "relation": "viewer",
      "subject": { "type": "user", "id": "charlie" }
    }
  ]
}
```

**Examples:**

```bash
# Seed to existing tenant
permify-toolkit relationships seed --tenant my-tenant-id --file-path ./data/relationships.json

# Seed and create tenant
permify-toolkit relationships seed --tenant new-tenant-id --file-path ./relationships.json --create-tenant
```

## Local Development

```bash
# Build the package
pnpm build

# Run using local bin script
./bin/permify-toolkit schema push --tenant dev-tenant -c
```
