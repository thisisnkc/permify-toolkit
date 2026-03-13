# CLAUDE.md — Permify Toolkit

## Project Goal

Build a **type-safe, developer-first toolkit** for integrating [Permify](https://permify.co) into TypeScript applications. The toolkit abstracts gRPC complexity and provides idiomatic APIs for NestJS, CLI workflows, and shared config — so teams can manage fine-grained authorization in one place.

## Architecture

Monorepo with `pnpm` workspaces. Three published packages:

| Package                   | Purpose                                                     |
| ------------------------- | ----------------------------------------------------------- |
| `@permify-toolkit/core`   | Schema DSL, client factory, permission/relationship helpers |
| `@permify-toolkit/cli`    | CLI for pushing schemas and seeding relationships           |
| `@permify-toolkit/nestjs` | NestJS module, guard, service, and decorators               |

`/simulator` — reference implementation (NestJS backend + frontend).

## Dev Commands

```bash
pnpm build          # build all packages
pnpm dev            # watch mode for all packages
pnpm test           # run all tests
pnpm lint           # lint all packages
pnpm format:check   # check formatting
pnpm changeset      # create a changeset for release
pnpm release        # build + publish to npm
```

## Goal-Driven Development Rules

1. **Every change must serve a clear goal.** Before writing code, state the goal (bug fix, feature, DX improvement). Don't refactor unless it directly enables the goal.

2. **Type safety is non-negotiable.** The schema DSL must remain fully type-safe. Avoid `any`. Prefer narrowing over casting.

3. **No breaking changes without a changeset.** Run `pnpm changeset` and describe the impact before merging anything that changes public API.

4. **Shared config is the source of truth.** `permify.config.ts` should be the single place teams define their Permify setup. CLI, NestJS, and tests all consume it — don't duplicate config paths.

5. **Minimal surface area.** Only add to `public-api.ts` when a feature is complete and stable. Internal helpers stay internal.

6. **Tests for every public function.** New exports in core/nestjs must have corresponding tests under `/tests` or the package's own test directory.

## Conventions

- **Commits**: Conventional commits enforced by commitlint (`feat:`, `fix:`, `chore:`, `docs:`, etc.)
- **Formatting**: Prettier — run `pnpm format:check` before committing
- **Package manager**: `pnpm` only — do not use `npm` or `yarn`
- **Exports**: Each package exports via `src/public-api.ts` — keep this file clean and intentional

## Release Flow

1. Make changes in a feature branch
2. `pnpm changeset` — describe what changed and bump type (patch/minor/major)
3. PR → merge to `main`
4. `pnpm version` — applies changeset, bumps package versions
5. `pnpm release` — builds and publishes to npm

## Key Files

- `packages/core/src/public-api.ts` — all public exports for core
- `packages/nestjs/src/module.ts` — PermifyModule (forRoot / forRootAsync)
- `packages/nestjs/src/guard.ts` — PermifyGuard (multi-permission support)
- `packages/cli/src/commands/` — CLI command implementations
- `simulator/backend/` — reference NestJS app showing real-world usage

---

## AI Assistant Behavioral Guidelines

These guidelines reduce common mistakes when working with AI assistants. Follow them to ensure quality contributions.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask clarifying questions.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If code exceeds ~150 lines when it could be ~50, rewrite it.

Ask: "Would a senior engineer reviewing this say it's overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if different.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless explicitly asked.

**The test**: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform vague tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Improve the API" → "Show before/after usage in tests, then implement"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria reduce back-and-forth. Weak criteria ("make it work") require constant clarification.

### 5. Project-Specific Constraints

When working with permify-toolkit:

- **Always check** `packages/*/src/public-api.ts` before adding exports
- **Run tests** after changes: `pnpm test`
- **Verify types**: Ensure no `any` types leak into public APIs
- **Use changesets**: Document breaking changes with `pnpm changeset`
- **Match patterns**: Follow existing patterns in core/nestjs/cli packages

---

**Success indicators:** Fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come _before_ implementation rather than after mistakes.
