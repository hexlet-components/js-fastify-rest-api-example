import scalar from "@scalar/fastify-api-reference";
import fp from "fastify-plugin";
import openapi from "../tsp-output/@typespec/openapi3/openapi.v1.json" with { type: "json" };

// Документация отдаётся из той же спеки, по которой зарегистрированы маршруты,
// поэтому разойтись с реализацией ей неоткуда.
export default fp(
  async (fastify) => {
    fastify.get("/openapi.json", async () => openapi);

    await fastify.register(scalar, {
      routePrefix: "/docs",
      configuration: { url: "/openapi.json" },
    });
  },
  { name: "docs" },
);
