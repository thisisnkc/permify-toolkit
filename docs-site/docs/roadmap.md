---
sidebar_label: Roadmap
title: Roadmap
---

# Roadmap

What we've shipped and what's next.

## General

- [x] Docs
- [ ] Permission result caching using [Bentocache](https://bentocache.dev/) (L1 in-memory + L2 Redis/database) to cut down gRPC round-trips for repeated checks
- [ ] OpenTelemetry tracing for permission checks and schema operations

## `@permify-toolkit/nestjs`

- [x] Multi permission checks (AND + OR logic)
- [ ] `@PermissionResult()` decorator to access check results inside handlers without re-checking
- [ ] Permission caching via NestJS `CacheModule`
- [ ] Audit logging interceptor for permission check decisions
- [ ] Typed entity and permission names from the schema DSL
- [ ] WebSocket gateway support

## `@permify-toolkit/cli`

- [x] Schema validation
- [x] Relationship queries (list, inspect, export)
- [x] Schema diff
- [ ] Schema pull
- [ ] Permission check from the terminal
- [ ] Relationship deletion (individual + bulk clear)
- [ ] Init command to scaffold `permify.config.ts`
- [ ] Schema version history
- [ ] Config validation (connection + schema syntax)
- [ ] Multi-tenant management (create, list, delete tenants)

---

Have ideas? [Open an issue](https://github.com/thisisnkc/permify-toolkit/issues) or start a [discussion](https://github.com/thisisnkc/permify-toolkit/discussions)!
