import Fastify from "fastify";
import glue from "fastify-openapi-glue";
import one from "./tsp-output/@typespec/openapi3/V1.json" with { type: "json" };
import two from "./tsp-output/@typespec/openapi3/V2.json" with { type: "json" };
import type { RouteHandlers as OneHandlers } from "./v1/fastify.gen.ts";
import type { RouteHandlers as TwoHandlers } from "./v2/fastify.gen.ts";
export async function buildVersionedServer() {
  const app = Fastify();
  const v1 = {
    getCourse: async (request, reply) =>
      reply.code(200).send({ id: request.params.courseId, title: "HTTP" }),
  } satisfies OneHandlers;
  const v2 = {
    getCourse: async (request, reply) =>
      reply.code(200).send({ id: request.params.courseId, name: "HTTP" }),
  } satisfies TwoHandlers;
  await app.register(glue, { specification: one, prefix: "/v1", serviceHandlers: v1 });
  await app.register(glue, { specification: two, prefix: "/v2", serviceHandlers: v2 });
  app.get("/v1/openapi.json", async () => ({ ...one, servers: [{ url: "/v1" }] }));
  app.get("/v2/openapi.json", async () => ({ ...two, servers: [{ url: "/v2" }] }));
  await app.ready();
  return app;
}
if (process.argv[1] === import.meta.filename) {
  const app = await buildVersionedServer();
  await app.listen({ port: 3000, host: "127.0.0.1" });
  console.log(app.listeningOrigin);
}
