# Implementation Plan: `schema pull`

**Goal:** Add `permify-toolkit schema pull` to the CLI — fetch the live schema from
the Permify server for a tenant and write it to a local `.perm` file.

**Why next:** Completes the schema workflow loop. We can already `push`, `validate`,
and `diff` against remote; `pull` is the inverse of `push` and lets users snapshot
or bootstrap a local schema from a running server. The reconstruction work is
already done — `readSchemaFromPermify` (core) returns a ready DSL string.

## What already exists (no new core work)

- `readSchemaFromPermify({ tenantId, client })` → `{ schema: string | null, entities }`
  - Already exported from `@permify-toolkit/core/public-api`.
  - Already used by `schema diff`. We reuse it as-is.
- `BaseCommand.clientFromConfigLite()` — client + config without requiring a local
  `schema` in config (correct here: pull doesn't need a local schema to exist).
- `BaseCommand.resolveTenant(flags, config)` — tenant resolution + error.

## Scope

One new command file + one test + one docs section. No core changes, no new deps,
no changeset for core. CLI gets a `minor` changeset (new public command).

## Steps

### 1. Command — `packages/cli/src/commands/schema/pull.ts` → verify: `pnpm build` passes

Mirror `push.ts` structure. Flags:

- `...BaseCommand.baseFlags` (gives `--tenant`)
- `--output, -o` (string, default `./schema.perm`) — destination file path
- `--force, -f` (boolean, default false) — overwrite if the file exists

Logic:

1. `const { client, config } = await this.clientFromConfigLite()` — no local schema needed.
2. `const tenantId = this.resolveTenant(flags, config)`.
3. `const { schema } = await readSchemaFromPermify({ tenantId, client })`.
4. If `schema === null` → `this.error("No schema found on remote for tenant: <id>")`.
5. Resolve output path. If it exists and `!flags.force` → `this.error(...)` telling
   the user to pass `--force`. (Guard against silent overwrite — this is a write
   boundary.)
6. `fs.writeFileSync(outPath, schema, "utf-8")`.
7. `this.log("✔ Schema pulled → <path> (tenant: <id>)")`.

Keep it ~40 lines, matching `push.ts`. No reformatting of remote output beyond what
core already reconstructs.

> ponytail: not adding `--stdout`, `--format json`, or merge-into-config options.
> Add `--stdout` only if someone asks to pipe it.

### 2. Test — `packages/cli/tests/schema-pull.spec.ts` → verify: `pnpm test` passes

Follow `schema-push.spec.ts` patterns (japa, `runCommand`, `fs` fixture). Cover:

- Fails when no tenant (flag or config) → asserts "Tenant ID is required".
- Fails on missing `permify.config.ts`.
- Refuses to overwrite an existing output file without `--force` → asserts the
  overwrite guard message (this is the one branch worth pinning down).
- Attempts connection when config + tenant present (fails on connection, like the
  push test does) — confirms it gets past arg/config validation.

> Real-server happy path isn't unit-testable here (no live Permify), same as push.
> The overwrite guard is the non-trivial branch, so it gets explicit coverage.

### 3. Docs — `docs-site/docs/packages/cli.md` → verify: section renders

Add a `#### \`schema pull\``section under`### Schema`, right after `schema push`
(it's the push inverse). Include: synopsis, flags table (`--tenant`, `--output`,
`--force`), 2–3 examples (default, custom output, force overwrite), and a one-line
note: pull then diff to compare environments.

### 4. Roadmap → verify: box checked

Tick `- [ ] Schema pull` → `- [x] Schema pull` in `docs-site/docs/roadmap.md`.

### 5. Changeset → verify: file created under `.changeset/`

`pnpm changeset` — `@permify-toolkit/cli` **minor**, message: "Add `schema pull`
command to fetch remote schema into a local .perm file."

## Out of scope (say so, don't build)

- `--stdout` / piping — add when requested.
- Pulling into the AST/inline config form — remote → DSL string only.
- Schema version selection (pull a specific historical version) — that's the separate
  "Schema version history" roadmap item.

## Done when

`pnpm build && pnpm test && pnpm lint && pnpm format:check` all pass, docs + roadmap
updated, changeset present.
