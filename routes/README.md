# Routes Folder

The route table of this application is **not** built from this folder's file
names. It is derived from the API contract: `main.tsp` (TypeSpec) is compiled to
OpenAPI in `tsp-output/`, and `fastify-openapi-glue` registers every operation
found there. This folder only supplies the implementations.

Note what follows from that, because it differs from the default Fastify
scaffold: files here are plain handler modules, not encapsulated plugins, and
`app.ts` does not autoload them (the `@fastify/autoload` call for `routes/` is
deliberately left out). Adding a file does not add an endpoint.

## How a handler is wired

`fastify-openapi-glue` matches the `operationId` of each operation in the spec
to a key in the handler map it is given. `routes/index.ts` builds that map:

```ts
const serviceHandlers: RouteHandlers = {
  ...users,
  ...courses,
  ...lessons,
  ...tokens,
}
```

`RouteHandlers` is generated from the spec and used in full, not as `Partial`,
so a contract operation without a handler fails type-checking instead of
surfacing as a runtime warning.

Each module exports its handlers through `defineHandlers` from `lib/utils.ts`,
which only supplies the generated types — request params, query, body, and
allowed responses are all typed from the contract:

```ts
const handlers = defineHandlers({
  async usersShow(request, reply) { ... },
})
```

## Adding an endpoint

1. Describe the operation in `main.tsp`. Every operation there declares an
   explicit `@operationId` — that string is the handler key, so pick it
   deliberately.
2. Run `make generate-types` and commit the regenerated files — CI's
   `make generate-check` fails otherwise.
3. Implement the handler in the module for that resource and spread the module
   into `routes/index.ts` if it is new.
4. Add a spec under `test/routes/`.

## Where the rest of the work lives

Request and response shapes are checked against the spec by glue and the
`response-validation` plugin, so handlers do not repeat those checks. Business
validation (uniqueness and the like) belongs in `validators/`, authorization in
`policies/`, response shaping in `serializers/`, and anything shared across
requests in `plugins/`, exposed via
[decorators](https://fastify.dev/docs/latest/Reference/Decorators/).

Group endpoints by resource: all `/users` operations in `users.ts`. When a
resource is nested, mirror the path with a folder — `/courses/{courseId}/lessons`
lives in `routes/api/courses/lessons.ts`.
