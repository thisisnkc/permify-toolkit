---
sidebar_position: 3
---

# Configuration

Permify Toolkit uses a single `permify.config.ts` file as the source of truth for your Permify connection, schema, and tenant. This config is shared between the CLI, NestJS module, and any standalone usage.

## Config File

Create `permify.config.ts` in your project root:

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
  })
});
```

## Creating a Client

### Option 1: Environment Variables (Recommended)

```typescript
import {
  createPermifyClient,
  clientOptionsFromEnv
} from "@permify-toolkit/core";

// Reads from PERMIFY_ENDPOINT, PERMIFY_INSECURE, etc.
const client = createPermifyClient(clientOptionsFromEnv());
```

**Supported environment variables:**

| Variable             | Description                  | Example             |
| -------------------- | ---------------------------- | ------------------- |
| `PERMIFY_ENDPOINT`   | Permify server endpoint      | `localhost:3478`    |
| `PERMIFY_INSECURE`   | Use insecure connection      | `true` / `false`    |
| `PERMIFY_TLS_CERT`   | Path to TLS certificate file | `/path/to/cert.pem` |
| `PERMIFY_TLS_KEY`    | Path to TLS key file         | `/path/to/key.pem`  |
| `PERMIFY_TLS_CA`     | Path to CA certificate file  | `/path/to/ca.pem`   |
| `PERMIFY_AUTH_TOKEN` | Permify access token         | `your-token`        |

You can also use a custom prefix:

```typescript
// Reads from MY_APP_ENDPOINT, MY_APP_INSECURE, etc.
const client = createPermifyClient(clientOptionsFromEnv("MY_APP_"));
```

### Option 2: Manual Configuration

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

### Client Options Reference

| Option                  | Type      | Description                          | Required | Default |
| ----------------------- | --------- | ------------------------------------ | -------- | ------- |
| `endpoint`              | `string`  | Permify server endpoint (host:port)  | Yes      | -       |
| `insecure`              | `boolean` | Use insecure connection (no SSL/TLS) | No       | `false` |
| `tls.cert`              | `Buffer`  | TLS certificate                      | No       | -       |
| `tls.key`               | `Buffer`  | TLS private key                      | No       | -       |
| `tls.ca`                | `Buffer`  | CA certificate                       | No       | -       |
| `interceptor.authToken` | `string`  | Auth token for requests              | No       | -       |
| `timeoutMs`             | `number`  | Request timeout in milliseconds      | No       | -       |

## Schema Definition Options

### Inline Schema (TypeScript DSL)

Define schemas with full type safety and IDE autocompletion:

```typescript
import { schema, entity, relation, permission } from "@permify-toolkit/core";

const mySchema = schema({
  user: entity({}),
  document: entity({
    relations: {
      owner: relation("user"),
      viewer: relation("user")
    },
    permissions: {
      edit: permission("owner"),
      view: permission("viewer or owner")
    }
  })
});
```

### File-based Schema

Reference an external `.perm` file:

```typescript
import { defineConfig, schemaFile } from "@permify-toolkit/core";

export default defineConfig({
  tenant: "t1",
  client: { endpoint: "localhost:3478", insecure: true },
  schema: schemaFile("./schema.perm")
});
```

Example `schema.perm`:

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

## Relationship Seeding Config

You can configure relationship seeding in the config file:

```typescript
export default defineConfig({
  // ...client and schema config
  relationships: {
    seedFile: "./relationships.json",
    mode: "append" // "append" (default) or "replace"
  }
});
```
