---
"@ratelock/core": patch
"@ratelock/local": patch
"@ratelock/redis": patch
"@ratelock/postgres": patch
"@ratelock/hono": patch
"@ratelock/express": patch
"@ratelock/fastify": patch
"@ratelock/elysia": patch
"@ratelock/nestjs": patch
---

Migrate the toolchain from ESLint + Prettier to oxlint + oxfmt (`@tala-tools/oxlint` / `@tala-tools/oxfmt`) and adopt TypeScript 7 for typecheck. No runtime behavior change; distributed files are reformatted to the new formatter's output.
