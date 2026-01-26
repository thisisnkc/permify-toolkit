# @permify-toolkit/cli

The Permify Toolkit CLI provides a set of commands to manage your Permify configuration and schema efficiently. It simplifies the process of interacting with your Permify instance directly from your terminal.

## Installation

This package is intended to be used with **pnpm**.

```bash
pnpm add -D @permify-toolkit/cli
```

## Configuration

The CLI relies on a `permify.config.ts` file in your project root. This file defines your Permify client endpoints and your schema structure.

**Example `permify.config.ts`:**

```typescript
import { defineConfig, schema, entity } from "@permify-toolkit/core";

export default defineConfig({
  client: {
    endpoint: "localhost:3478" // Your Permify instance endpoint
  },
  schema: schema({
    user: entity({
      // Define your entity structure here
    })
  })
});
```

## Commands

### `schema push`

Pushes definitions defined in your `permify.config.ts` to the configured Permify server.

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
