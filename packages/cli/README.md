# @permify-toolkit/cli

[![NPM Version](https://img.shields.io/npm/v/@permify-toolkit/cli)](https://www.npmjs.com/package/@permify-toolkit/cli)
[![License](https://img.shields.io/github/license/thisisnkc/permify-toolkit)](https://github.com/thisisnkc/permify-toolkit/blob/main/LICENSE)

CLI for pushing schemas and seeding relationships to [Permify](https://github.com/Permify/permify).

## Installation

```bash
pnpm add -D @permify-toolkit/cli
```

## Quick Example

```bash
# Push schema from permify.config.ts
permify-toolkit schema push

# Seed relationships from a JSON file
permify-toolkit relationships seed --file-path ./data/relationships.json

# Push to a new tenant (creates it if needed)
permify-toolkit schema push --tenant new-tenant -c
```

## Commands

| Command | Description |
| --- | --- |
| `schema push` | Push schema to Permify server |
| `relationships seed` | Seed relationship tuples from JSON |

## Features

- **Shared Config** — reads from `permify.config.ts`, no flag duplication
- **Inline or File Schemas** — TypeScript DSL or `.perm` files
- **Tenant Management** — auto-create tenants with `--create-tenant`
- **Schema Validation** — Permify validates on push with detailed error messages

## Documentation

For full documentation, guides, and API reference, visit the **[Permify Toolkit Docs](https://thisisnkc.github.io/permify-toolkit/)**.
