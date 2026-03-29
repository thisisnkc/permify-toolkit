# Relationship Query CLI Commands — Design Spec

**Date:** 2026-03-29
**Status:** Approved
**Roadmap item:** Relationship query CLI commands — list, inspect, and export existing relationships from a tenant

## Goal

Add read-only CLI commands that let developers query, inspect, and export existing relationship tuples from a Permify tenant. This fills the gap between write-only commands (`relationships seed`) and the need to debug, audit, or migrate authorization data.

## Commands

### `relationships list`

Display relationships from a tenant in the terminal.

**Flags:**

| Long | Short / Alias | Type | Required | Default | Description |
|------|---------------|------|----------|---------|-------------|
| `--tenant` | — | string | no | from config | Tenant ID (inherited from BaseCommand) |
| `--create-tenant` | `-c` | boolean | no | false | Create tenant if missing (inherited) |
| `--entity-type` | `-e` | string | **yes** | — | Entity type to query |
| `--entity-id` | `--eid` | string | no | — | Filter by entity ID |
| `--relation` | `-r` | string | no | — | Filter by relation name |
| `--subject-type` | `-s` | string | no | — | Filter by subject type |
| `--subject-id` | `--sid` | string | no | — | Filter by subject ID |
| `--output` | `-o` | string | no | `table` | Output format: `table` or `compact` |
| `--page-size` | `-p` | integer | no | 50 | Results per page |

**Output modes:**

- **table** (default):
  ```
  Entity Type  Entity ID  Relation  Subject Type  Subject ID  Subject Relation
  document     123        owner     user          456
  document     123        viewer    team          dev         member
  ```

- **compact** (one tuple per line, Permify notation):
  ```
  document:123#owner@user:456
  document:123#viewer@team:dev#member
  ```
  When `subject.relation` is empty string, the trailing `#` is omitted.

**Behavior:**
- Fetches all pages automatically using the SDK's `continuousToken` pagination.
- Buffers all results then prints (same core function as export; streaming can be added later if needed).
- Prints total count at the end: `✔ Found 42 relationships`.
- Prints `ℹ No relationships found.` when result set is empty.

### `relationships export`

Write relationships to a JSON file in a format directly compatible with `relationships seed`.

**Flags:**

| Long | Short / Alias | Type | Required | Default | Description |
|------|---------------|------|----------|---------|-------------|
| `--tenant` | — | string | no | from config | Tenant ID (inherited) |
| `--create-tenant` | `-c` | boolean | no | false | Create tenant if missing (inherited) |
| `--entity-type` | `-e` | string | **yes** | — | Entity type to query |
| `--entity-id` | `--eid` | string | no | — | Filter by entity ID |
| `--relation` | `-r` | string | no | — | Filter by relation name |
| `--subject-type` | `-s` | string | no | — | Filter by subject type |
| `--subject-id` | `--sid` | string | no | — | Filter by subject ID |
| `--file-path` | `-f` | string | **yes** | — | Output file path (.json) |
| `--page-size` | `-p` | integer | no | 100 | Results per page |

**Output format:**
```json
{
  "tuples": [
    {
      "entity": { "type": "document", "id": "123" },
      "relation": "owner",
      "subject": { "type": "user", "id": "456" }
    }
  ]
}
```

This is the exact format consumed by `relationships seed --file-path`, enabling round-trip migration between tenants.

**Behavior:**
- Fetches all pages before writing (needs complete data for valid JSON).
- Writes atomically to the output file.
- Logs: `✔ Exported 42 relationships to ./output.json`.
- Errors if file path has no `.json` extension (case-insensitive).
- Validates that the output directory exists before fetching.

## Core Package Changes

### New: `readRelationships(params)`

**File:** `packages/core/src/data/read-relationships.ts`

Wraps `client.data.readRelationships()` with automatic pagination. Collects all pages and returns the full result.

```typescript
interface ReadRelationshipsParams {
  client: PermifyClient;
  tenantId: string;
  filter: {
    entity: { type: string; ids?: string[] };
    relation?: string;
    subject?: { type: string; ids?: string[]; relation?: string };
  };
  pageSize?: number;
}

async function readRelationships(
  params: ReadRelationshipsParams
): Promise<Relationship[]>
```

- Client is passed inside params (consistent with `writeRelationships`, `deleteRelationships`).
- Handles pagination internally via `continuousToken`.
- When `filter.entity.ids` is omitted, passes `[]` to the SDK (required field).
- Converts SDK `Tuple` objects to the existing `Relationship` interface.
- Exported from `packages/core/src/public-api.ts`.

### BaseCommand: new `clientFromConfigLite()` method

The existing `clientFromConfig()` enforces `config.schema`, which read-only commands don't need. Add a new method to `BaseCommand`:

```typescript
protected async clientFromConfigLite(): Promise<{ client: any; config: Config }> {
  const config = await loadConfig();
  if (!config.client?.endpoint) {
    this.error("Client endpoint not defined in config");
  }
  const client = createPermifyClient(config.client);
  return { client, config };
}
```

The `list` and `export` commands use `clientFromConfigLite()` instead of `clientFromConfig()`. This avoids requiring a schema in config for read-only operations.

## Shared Filter Logic

Both CLI commands use the same set of filter flags. A shared helper constructs the `TupleFilter` from parsed flags:

```typescript
function buildTupleFilter(flags: FilterFlags): TupleFilter
```

- Wraps single `--entity-id` / `--subject-id` values into `ids: [value]` arrays.
- Passes `ids: []` when no IDs are specified (SDK requires the field).
- This lives in `packages/cli/src/helpers.ts` alongside existing helpers.

## File Structure

```
packages/core/src/data/read-relationships.ts       # new — core wrapper
packages/cli/src/commands/relationships/list.ts     # new — list command
packages/cli/src/commands/relationships/export.ts   # new — export command
packages/cli/tests/relationships-list.spec.ts       # new — list tests
packages/cli/tests/relationships-export.spec.ts     # new — export tests
```

## Testing Strategy

Tests use the existing japa + `runCommand` pattern.

### `relationships list` tests:
- Missing `--entity-type` → error
- Missing tenant (no flag, no config) → error
- Valid config: table output format verified
- Valid config: compact output format verified
- Empty result set → info message

### `relationships export` tests:
- Missing `--entity-type` → error
- Missing `--file-path` → error
- Invalid file extension (not `.json`) → error
- Missing tenant → error
- Valid export: file written with correct seed-compatible structure

### Core `readRelationships` tests:
- Returns mapped `Relationship[]` from SDK tuples
- Handles pagination (multiple pages)
- Handles empty result set
- SDK error propagation (network failure, invalid tenant)

## Design Decisions

1. **Two commands, not three.** "Inspect" is `list` with narrower filters — a separate command adds surface area without new capability.
2. **JSON only for export.** Matches seed format for round-trip. YAML/CSV can be added later.
3. **Entity type required.** Matches the SDK's `TupleFilter` requirement and prevents accidental full-tenant dumps.
4. **Dual long-form aliases** via oclif's `aliases` option: `Flags.string({ aliases: ['eid'] })` produces `--eid`. Used for `--entity-id`/`--eid` and `--subject-id`/`--sid`.
5. **Buffering for both commands.** Both use the same core `readRelationships` function that collects all pages. Streaming can be added later as an optimization if memory becomes a concern.
6. **No `--snap-token` or `--subject-relation` flags initially.** These are supported by the SDK but excluded to keep the initial surface area minimal. Can be added in a follow-up.
7. **`clientFromConfigLite()` for read-only commands.** Avoids requiring `schema` in config, which is only needed for write operations.
