---
"@permify-toolkit/core": minor
"@permify-toolkit/cli": minor
---

feat: add schema diff command to preview changes before pushing

- New CLI command `schema diff` compares local schema against the deployed schema on the Permify server
- Supports local-vs-local comparison via `--source` flag (no server needed)
- Structural summary shows added, removed, and modified entities, relations, and permissions
- `--verbose` flag shows a unified text diff for full detail
- `--exit-code` flag exits with code 1 when changes are detected (for CI pipelines)
- New core exports: `readSchemaFromPermify`, `diffSchema`, `textDiff`
