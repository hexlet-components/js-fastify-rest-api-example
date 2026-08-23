# Repository Guidelines

## Project Structure & Module Organization

- `app.ts`: Fastify entry. Autoloads `plugins/`, then registers
  `fastify-openapi-glue` with the generated OpenAPI spec and the handler map
  from `routes/index.ts`. Routes are **not** autoloaded — the route table comes
  from the spec, so a route exists only if it is described in `main.tsp`.
- `main.tsp`, `tsp-output/`: TypeSpec contract (source of truth) and the OpenAPI
  it emits. Versions `v1` and `v2` are declared; code and codegen use `v1`.
- `routes/api/`: handler modules grouped by resource (`users.ts`, `courses.ts`,
  `courses/lessons.ts`, `tokens.ts`), each wrapped in `defineHandlers`.
  `routes/index.ts` merges them into `RouteHandlers` — the full generated type,
  not `Partial`, so a missing handler is a compile error.
- `plugins/`: JWT auth, Drizzle (in-memory SQLite, migrated and seeded on boot),
  response validation, `@fastify/sensible`.
- `db/`: Drizzle schema and seeds; generated migrations live in `drizzle/`.
- `validators/`, `rules/`: business validation (zod, built on the generated
  schemas), kept out of handlers.
- `serializers/`, `policies/`, `lib/`: response shaping, authorization,
  shared helpers.
- `types/`: `fastify.d.ts` (hand-written decorator typings) and
  `types/handlers/*.gen.ts` — **generated, never edit by hand**.
- `test/`: Vitest specs in `test/routes/`, mirroring `routes/`; server bootstrap
  in `test/helper.ts`.

## Build, Test, and Development Commands

Package manager is pnpm (`packageManager` in `package.json`); Node >= 26.

- `make install`: install dependencies.
- `make dev`: Fastify with watch on http://localhost:3000.
- `make test`: Vitest run.
- `make lint`: oxlint + `tsc` + format check. `make lint-fix` autofixes.
- `make check-types`: `tsc` only (same check `make lint` runs).
- `make routes`: print the route table registered from the spec.
- `make generate-types`: TypeSpec → OpenAPI → handler types and zod schemas,
  then format. `make generate-check` (CI) fails if the result is not committed.
- `make migration-generate`: Drizzle migration from the changed schema.
- `make mock`: Prism mock server from the generated OpenAPI.

## Coding Style & Naming Conventions

- **TypeScript only**, ESM (`type: module`). Node executes `.ts` directly — no
  build step, no bundler.
- **Local imports carry the explicit `.ts` extension** (`allowImportingTsExtensions`
  with `NodeNext`): `import users from "./api/users.ts"`.
- `tsconfig.json` sets `noEmit: true` — `tsc` type-checks, it never emits.
- **Formatting** by oxfmt: 2-space indent, semicolons, double quotes. Linting by
  oxlint (`.oxlintrc.json`). Run `make lint` before committing.
- Changing the API means editing `main.tsp` first, then `make generate-types`,
  then the handler. Never patch `tsp-output/` or `types/handlers/` directly.

## Testing Guidelines

- **Framework**: Vitest with `app.inject()`; see `test/helper.ts`.
- **Naming**: specs go to `test/routes/**/*.test.ts`. `vitest.config.ts` includes
  only `*.test.ts` — a `.test.js` file is silently skipped.
- **Scope**: add success tests for each new/changed route. No coverage gate.

## Commit & Pull Request Guidelines

- **Commits**: Conventional Commits, imperative mood (this repo writes them in
  Russian). Reference issues when applicable.
- **PRs**: the PR title must be a Conventional Commit — it becomes the squash
  commit message and CI checks it. Provide purpose, summary, test plan, and
  example requests/responses. Keep diffs focused.

## Security & Configuration Tips

- **Secrets**: the JWT secret is hardcoded in `plugins/jwt.ts` for teaching
  purposes. Move it to an env var (`JWT_SECRET`) before any real deployment;
  use `.env` locally and never commit it.
- **DB**: SQLite in memory (`plugins/drizzle.ts`) — the database is recreated,
  migrated, and seeded on every boot. Switch to a file or a real server for
  persistence.
