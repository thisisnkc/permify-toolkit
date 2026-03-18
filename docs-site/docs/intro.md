---
sidebar_position: 1
slug: /
---

# Introduction

**Permify Toolkit** is a type-safe TypeScript toolkit for [Permify](https://github.com/Permify/permify) — the open-source authorization service inspired by Google Zanzibar.

Working with Permify's gRPC API directly is verbose. Permify Toolkit wraps it in a clean, type-safe TypeScript API so you can focus on your authorization model, not the plumbing.

## Why Permify Toolkit?

- **Zero gRPC boilerplate** — connect with a single function call or environment variables
- **Type-safe schema DSL** — define entities, relations, and permissions in TypeScript with full autocompletion
- **One config file** — `permify.config.ts` is shared between your NestJS app and CLI; no duplication
- **NestJS-first** — drop-in module, `@CheckPermission()` decorator, and guard with multi-permission AND/OR logic
- **CLI included** — push schemas and seed relationships without writing scripts

## Packages

This monorepo publishes three focused packages:

| Package | Purpose |
| --- | --- |
| [`@permify-toolkit/core`](/docs/packages/core) | Schema DSL, client factory, shared config |
| [`@permify-toolkit/nestjs`](/docs/packages/nestjs) | NestJS module, guard, decorators |
| [`@permify-toolkit/cli`](/docs/packages/cli) | Schema push, relationship seeding |

## When to Use It

1. **Any TypeScript backend** — Express, Fastify, Lambda, or NestJS projects that need Permify with better type safety
2. **Authorization-as-code** — define and push schemas from your codebase, not from a dashboard
3. **NestJS apps** — get drop-in permission guards with zero configuration overhead
