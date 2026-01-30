# @permify-toolkit/cli

The Permify Toolkit CLI provides a set of commands to manage your Permify configuration and schema efficiently. It simplifies the process of interacting with your Permify instance directly from your terminal.

## Installation

This package is intended to be used with **pnpm**.

```bash
pnpm add -D @permify-toolkit/cli
```

## Configuration

The CLI relies on a `permify.config.ts` file in your project root. This file defines your Permify client connection settings and your schema structure.

### Schema Definition Options

You can define your schema in two ways:

#### 1. Inline Schema (AST-based)

Define your schema directly in the config file using the `schema()` function:

```typescript
import {
  defineConfig,
  schema,
  entity,
  relation,
  permission
} from "@permify-toolkit/core";

export default defineConfig({
  client: {
    endpoint: "localhost:3478",
    insecure: true // Use for local development without SSL
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
  })
});
```

#### 2. File-based Schema

Reference an external `.perm` schema file using the `schemaFile()` function:

```typescript
import { defineConfig, schemaFile } from "@permify-toolkit/core";

export default defineConfig({
  client: {
    endpoint: "localhost:3478",
    insecure: true
  },
  schema: schemaFile("./schema.perm")
});
```

**Example `schema.perm` file:**

```
entity user {}

entity organization {
  relation member @user

  permission view = member
}

entity document {
  relation owner @user
  relation parent @organization

  permission view = owner or parent.view
  permission edit = owner
}
```

### Client Configuration Options

| Option      | Type      | Description                              | Required | Default |
| :---------- | :-------- | :--------------------------------------- | :------- | :------ |
| `endpoint`  | `string`  | Permify server endpoint (host:port)      | Yes      | -       |
| `insecure`  | `boolean` | Use insecure connection (no SSL/TLS)     | No       | `false` |
| `cert`      | `string`  | TLS certificate for secure connections   | No       | -       |
| `pk`        | `string`  | Private key for secure connections       | No       | -       |
| `certChain` | `string`  | Certificate chain for secure connections | No       | -       |

## Commands

### `schema push`

Pushes the schema defined in your `permify.config.ts` to the configured Permify server.

**Usage:**

```bash
permify-toolkit schema push --tenant <tenant-id> [flags]
```

**Flags:**

| Flag              | Alias | Description                                             | Required | Default |
| :---------------- | :---- | :------------------------------------------------------ | :------- | :------ |
| `--tenant`        |       | The Tenant ID to push the schema to.                    | Yes      | -       |
| `--create-tenant` | `-c`  | Creates the tenant if it does not exist before pushing. | No       | `false` |

**Examples:**

Push to an existing tenant:

```bash
permify-toolkit schema push --tenant my-tenant-id
```

Push to a tenant, creating it if it doesn't exist:

```bash
permify-toolkit schema push --tenant new-tenant-id --create-tenant
```

**Schema Validation:**

The Permify server validates your schema when you push it. If there are any errors (e.g., referencing non-existent entities), you'll receive a detailed error message:

```
Error: Entity "usr" referenced in relation "document.owner" does not exist
```

## Development

To develop and test changes locally:

1.  Make your changes.
2.  Build the package:
    ```bash
    pnpm build
    ```
3.  Run the CLI using the local bin script:
    ```bash
    ./bin/permify-toolkit <command> [flags]
    ```

Example:

```bash
./bin/permify-toolkit schema push --tenant dev-tenant -c
```

## Features

- **Flexible Schema Definition**: Choose between inline TypeScript schemas or external `.perm` files
- **Type Safety**: Full TypeScript support with autocomplete for inline schemas
- **Schema Validation**: Permify validates your schema on push, catching errors early
- **Tenant Management**: Automatically create tenants if they don't exist
- **Secure & Insecure Connections**: Support for both SSL/TLS and insecure local development
- **File Validation**: Automatic validation of `.perm` file paths and extensions
