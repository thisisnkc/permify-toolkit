---
sidebar_position: 3
---

# @permify-toolkit/cli

CLI for managing schemas, seeding relationships, and querying relationship data from your Permify instance.

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

| Flag              | Alias | Description                       | Default     |
| ----------------- | ----- | --------------------------------- | ----------- |
| `--tenant`        |       | Tenant ID to push to              | From config |
| `--create-tenant` | `-c`  | Create tenant if it doesn't exist | `false`     |

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

### `schema validate`

Validates your schema locally without connecting to a Permify server. Catches structural errors, broken references, permission cycles, and suspicious patterns before you push.

```bash
permify-toolkit schema validate
```

This command takes no flags. It reads schema configuration from `permify.config.ts` in the current directory.

**What it checks:**

| Category              | Examples                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| **Input**             | Schema source exists, file readable, `.perm` extension required                                    |
| **Structure**         | At least one entity defined                                                                        |
| **References**        | Relation targets exist, permission symbols resolve, traversal targets valid                        |
| **Expression syntax** | No dangling operators (`owner or`), balanced parentheses, no double-dot traversal (`parent..view`) |
| **Cycles**            | Direct self-reference (`view = view`), indirect cycles (`view → edit → view`)                      |
| **Warnings**          | Unused relations, entities with no permissions                                                     |

**Output:**

When the schema is valid:

```
✔ Schema is valid
```

When valid but with warnings:

```
⚠ Schema is valid with warnings

Warnings:
  1. Entity "document": relation "viewer" is never used in any permission
  2. Entity "organization": has no permissions defined
```

When validation fails:

```
Error: Schema validation failed:
Permission "document.view" references undefined relation or permission "viewer"
```

**Examples:**

```bash
# Validate schema in your current project
permify-toolkit schema validate

# Validate before pushing in CI
permify-toolkit schema validate && permify-toolkit schema push
```

:::tip Use before push
Run `schema validate` before `schema push` for instant local feedback, no server connection needed.
:::

### `relationships seed`

Seeds relationship data from a JSON file.

```bash
permify-toolkit relationships seed [--tenant <id>] [--file-path <path>] [flags]
```

**Flags:**

| Flag              | Alias | Description                       | Default     |
| ----------------- | ----- | --------------------------------- | ----------- |
| `--tenant`        |       | Tenant ID to seed to              | From config |
| `--file-path`     | `-f`  | Path to JSON file with tuples     | From config |
| `--create-tenant` | `-c`  | Create tenant if it doesn't exist | `false`     |

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

### `relationships list`

Queries and displays relationship tuples from a Permify tenant. Useful for debugging authorization — quickly see what relationships exist for a given entity type.

Unlike `schema push` or `relationships seed`, this command **does not require a schema** in your config. It only needs a `client` connection.

```bash
permify-toolkit relationships list --entity-type <type> [--tenant <id>] [flags]
```

**Flags:**

| Flag             | Alias | Description                         | Required | Default     |
| ---------------- | ----- | ----------------------------------- | -------- | ----------- |
| `--entity-type`  | `-e`  | Entity type to query                | Yes      |             |
| `--tenant`       |       | Tenant ID                           | No       | From config |
| `--entity-id`    |       | Filter by a specific entity ID      | No       |             |
| `--relation`     | `-r`  | Filter by relation name             | No       |             |
| `--subject-type` | `-s`  | Filter by subject type              | No       |             |
| `--subject-id`   |       | Filter by subject ID                | No       |             |
| `--output`       | `-o`  | Output format: `table` or `compact` | No       | `table`     |
| `--page-size`    | `-p`  | Number of results per gRPC page     | No       | `50`        |

**Minimal config required:**

```typescript
// permify.config.ts — no schema needed for read-only commands
export default {
  tenant: "t1",
  client: {
    endpoint: "localhost:3478",
    insecure: true
  }
};
```

**Examples:**

```bash
# List all relationships for the "document" entity type
permify-toolkit relationships list -e document

# Filter by relation and subject
permify-toolkit relationships list -e document -r viewer -s user

# Show a specific entity's relationships
permify-toolkit relationships list -e document --entity-id doc-1

# Use compact output (one tuple per line)
permify-toolkit relationships list -e document -o compact

# Specify tenant and page size
permify-toolkit relationships list -e document --tenant my-tenant -p 100
```

**Output formats:**

Table (default):

```
Entity Type  Entity ID  Relation  Subject Type  Subject ID  Subject Relation
document     doc-1      owner     user          alice
document     doc-1      viewer    user          bob
document     doc-2      viewer    group         eng         member
✔ Found 3 relationships
```

Compact (one Zanzibar-style tuple per line):

```
document:doc-1#owner@user:alice
document:doc-1#viewer@user:bob
document:doc-2#viewer@group:eng#member
✔ Found 3 relationships
```

When no relationships match:

```
ℹ No relationships found.
```

:::tip Debugging permissions
Use `relationships list` to verify that the tuples you expect actually exist in Permify. If a permission check fails unexpectedly, list the relationships for that entity to see what's stored.
:::

### `relationships export`

Exports relationship tuples from a Permify tenant to a JSON file. The output format is identical to the `relationships seed` input format — so you can export from one tenant and seed into another.

Like `relationships list`, this command **does not require a schema** in your config.

```bash
permify-toolkit relationships export --entity-type <type> --file-path <path> [--tenant <id>] [flags]
```

**Flags:**

| Flag             | Alias | Description                        | Required | Default     |
| ---------------- | ----- | ---------------------------------- | -------- | ----------- |
| `--entity-type`  | `-e`  | Entity type to query               | Yes      |             |
| `--file-path`    | `-f`  | Output file path (must be `.json`) | Yes      |             |
| `--tenant`       |       | Tenant ID                          | No       | From config |
| `--entity-id`    |       | Filter by a specific entity ID     | No       |             |
| `--relation`     | `-r`  | Filter by relation name            | No       |             |
| `--subject-type` | `-s`  | Filter by subject type             | No       |             |
| `--subject-id`   |       | Filter by subject ID               | No       |             |
| `--page-size`    | `-p`  | Number of results per gRPC page    | No       | `100`       |

**Examples:**

```bash
# Export all document relationships to a file
permify-toolkit relationships export -e document -f ./backup/documents.json

# Export only viewer relationships
permify-toolkit relationships export -e document -r viewer -f viewers.json

# Export from a specific tenant
permify-toolkit relationships export -e document --tenant staging -f staging-docs.json
```

**Output file format:**

The exported JSON file uses the same structure as `relationships seed`, so you can directly re-import it:

```json
{
  "tuples": [
    {
      "entity": { "type": "document", "id": "doc-1" },
      "relation": "owner",
      "subject": { "type": "user", "id": "alice" }
    },
    {
      "entity": { "type": "document", "id": "doc-1" },
      "relation": "viewer",
      "subject": { "type": "user", "id": "bob" }
    }
  ]
}
```

**Common workflows:**

```bash
# Back up relationships before a migration
permify-toolkit relationships export -e document -f ./backup/documents.json
permify-toolkit relationships export -e organization -f ./backup/orgs.json

# Copy relationships from staging to dev
permify-toolkit relationships export -e document --tenant staging -f transfer.json
permify-toolkit relationships seed --tenant dev -f transfer.json

# Export, inspect, edit, then re-seed
permify-toolkit relationships export -e document -f tuples.json
# ... edit tuples.json manually ...
permify-toolkit relationships seed --tenant t1 -f tuples.json
```

:::tip Export + Seed round-trip
The export format is designed to be seed-compatible. You can export from one environment, review or modify the JSON, and seed it into another — making it easy to migrate or duplicate relationship data across tenants.
:::

## Local Development

```bash
# Build the package
pnpm build

# Run using local bin script
./bin/permify-toolkit schema push --tenant dev-tenant -c
```
