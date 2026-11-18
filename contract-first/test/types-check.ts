import type { RouteHandlers } from "../generated/fastify.gen.ts";
import { createCourse } from "../generated/sdk.gen.ts";
// A final implementation must include every operation.
// @ts-expect-error A partial operation map cannot be installed as the full API.
const incomplete: RouteHandlers = {};
void incomplete;
// @ts-expect-error The contract requires a string title.
void createCourse({ body: { title: 42 }, headers: { "Idempotency-Key": "type-probe" } });
