import Fastify from "fastify";
import addFormats from "ajv-formats";
import glue from "fastify-openapi-glue";
import responseValidator from "@fastify/response-validation";
import specification from "./tsp-output/@typespec/openapi3/openapi.json" with { type: "json" };
import { handlers } from "./handlers.ts";
export async function buildServer() {
  const app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    reply
      .code(status)
      .type("application/problem+json")
      .send({
        type: "https://example.org/problems/invalid",
        title: "Request failed",
        status,
        detail: status === 500 ? "Internal Server Error" : (error as Error).message,
      });
  });
  await app.register(responseValidator, {
    responseStatusCodeValidation: true,
    ajv: {
      coerceTypes: false,
      removeAdditional: false,
      useDefaults: false,
      plugins: [addFormats.default],
    },
  });
  await app.register(glue, { specification, serviceHandlers: handlers });
  await app.ready();
  return app;
}
if (process.argv[1] === import.meta.filename) {
  const app = await buildServer();
  await app.listen({ port: 3000, host: "127.0.0.1" });
  console.log(app.listeningOrigin);
}
