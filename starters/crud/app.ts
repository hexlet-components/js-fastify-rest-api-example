import Fastify from "fastify";
import glue from "fastify-openapi-glue";
import responseValidator from "@fastify/response-validation";
import addFormats from "ajv-formats";
import specification from "./tsp-output/@typespec/openapi3/openapi.json" with { type: "json" };
import { createStore } from "./db.ts";
import { createHandlers } from "./handlers.ts";

export async function buildServer(options: { databaseUrl?: string } = {}) {
  const app = Fastify({ ajv: { customOptions: { removeAdditional: false } } });
  const store = await createStore(options.databaseUrl);
  app.addHook("onClose", async () => store.close());
  app.setErrorHandler((error, _request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    reply
      .code(status)
      .type("application/problem+json")
      .send({
        title: status >= 500 ? "Internal Server Error" : "Request failed",
        status,
        detail:
          status >= 500
            ? "The server could not complete the request"
            : error instanceof Error
              ? error.message
              : "Request failed",
      });
  });
  const operations = new Map<
    string,
    { requestBody?: { required?: boolean; content: Record<string, unknown> } }
  >();
  for (const [path, item] of Object.entries(specification.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      operations.set(`${method.toUpperCase()} ${path.replace(/\{([^}]+)\}/g, ":$1")}`, operation);
    }
  }
  app.addHook("preValidation", async (request) => {
    const body = operations.get(`${request.method} ${request.routeOptions.url}`)?.requestBody;
    if (body?.required && request.body === undefined) {
      throw Object.assign(new Error("Request body is required"), { statusCode: 400 });
    }
    if (body && request.body !== undefined) {
      const mediaType = request.headers["content-type"]?.split(";")[0].trim().toLowerCase();
      if (!body.content[mediaType ?? ""]) {
        throw Object.assign(new Error("Unsupported media type"), { statusCode: 415 });
      }
    }
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
  await app.register(glue, { specification, serviceHandlers: createHandlers(store) });
  await app.ready();
  return app;
}
if (process.argv[1] === import.meta.filename) {
  const app = await buildServer();
  const address = await app.listen({ port: 3000, host: "127.0.0.1" });
  console.log(address);
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void app.close();
    });
  }
}
