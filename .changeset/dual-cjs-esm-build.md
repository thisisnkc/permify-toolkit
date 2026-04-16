---
"@permify-toolkit/core": patch
"@permify-toolkit/nestjs": patch
"@permify-toolkit/cli": patch
---

Add dual ESM/CJS build output. Packages now ship both `.mjs` (ESM) and `.cjs` (CJS) formats via tsup, enabling `require()` in CommonJS environments like default NestJS projects.
