import Fastify, { type FastifyRequest } from "fastify";
import glue from "fastify-openapi-glue";
import responseValidator from "@fastify/response-validation";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import addFormats from "ajv-formats";
import specification from "../tsp-output/@typespec/openapi3/openapi.json" with { type: "json" };
import { createStore } from "./db.ts";
import { createHandlers } from "./handlers.ts";
import { fail, problem, runExports, deliverEvents } from "./services.ts";

export const devSecret = "development-only-secret-change-before-deployment";
export async function buildServer(
  options: {
    databaseUrl?: string;
    seed?: boolean;
    rateLimit?: boolean;
    runJobs?: boolean;
    failExports?: boolean;
    webhookUrl?: string;
  } = {},
) {
  // OpenAPI 3.0 nullable references use allOf; Ajv needs an explicit null branch.
  const runtimeSpecification = structuredClone(specification);
  function nullable(node: unknown): void {
    if (!node || typeof node !== "object") return;
    const object = node as Record<string, any>;
    for (const value of Object.values(object)) nullable(value);
    if (object.nullable && object.allOf) {
      const branch = { ...object };
      delete branch.nullable;
      for (const key of Object.keys(object)) delete object[key];
      object.anyOf = [branch, { type: "object", nullable: true, enum: [null] }];
    }
  }
  nullable(runtimeSpecification);
  const app = Fastify({
    bodyLimit: 1024 * 1024,
    ajv: {
      customOptions: { removeAdditional: false, coerceTypes: true },
      plugins: [
        (ajv) => {
          ajv.addKeyword({
            keyword: "isBuffer",
            validate: (_schema: boolean, data: unknown) => Buffer.isBuffer(data),
            errors: false,
          });
          return ajv;
        },
      ],
    },
  });
  const store = await createStore(options.databaseUrl);
  app.get("/health", async () => ({ status: "ok" }));

  app.setErrorHandler((error, request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    reply
      .code(status)
      .type("application/problem+json")
      .send(problem(status, status >= 500 ? "Internal Server Error" : (error as Error).message));
  });
  app.addContentTypeParser("image/png", { parseAs: "buffer" }, (_request, body, done) =>
    done(null, body),
  );
  await app.register(jwt, { secret: process.env.JWT_SECRET ?? devSecret });
  if (options.rateLimit)
    await app.register(rateLimit, {
      hook: "preHandler",
      global: true,
      max: 3,
      timeWindow: 1000,
      allowList: (request) => request.routeOptions.url !== "/me",
      keyGenerator: (request) => String(request.user?.id ?? request.ip),
    });
  const operations = new Map<string, Record<string, any>>();
  for (const [path, item] of Object.entries(specification.paths))
    for (const [method, operation] of Object.entries(item))
      if (operation && typeof operation === "object")
        operations.set(`${method.toUpperCase()} ${path.replace(/\{([^}]+)\}/g, ":$1")}`, operation);
  app.addHook("preValidation", async (request) => {
    const body = operations.get(`${request.method} ${request.routeOptions.url}`)?.requestBody;
    if (body?.required && request.body === undefined) fail(400, "Request body is required");
    if (body && request.body !== undefined) {
      const contentType = request.headers["content-type"]?.split(";")[0].trim().toLowerCase();
      if (!body.content[contentType ?? ""]) fail(415, "Unsupported media type");
    }
  });
  app.addHook("onRoute", (route) => {
    const body = operations.get(
      `${Array.isArray(route.method) ? route.method[0] : route.method} ${route.url}`,
    )?.requestBody;
    if (body?.content?.["image/png"]?.schema?.format === "binary" && route.schema)
      route.schema.body = { isBuffer: true };
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
  await app.register(glue, {
    specification: runtimeSpecification,
    serviceHandlers: createHandlers(app, store),
    securityHandlers: {
      BearerAuth: async (request: FastifyRequest) => {
        try {
          await request.jwtVerify();
        } catch {
          fail(401, "Invalid or missing bearer token");
        }
        if (!Number.isInteger(request.user.id) || !Array.isArray(request.user.scopes))
          fail(401, "Invalid token claims");
      },
    },
  });
  app.get("/openapi.json", async () => specification);
  app.get("/docs", async (_request, reply) =>
    reply
      .type("text/html")
      .send(
        '<!doctype html><html><head><title>Catalog API</title></head><body><a href="/openapi.json">OpenAPI</a><script id="api-reference" data-url="/openapi.json"></script><script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script></body></html>',
      ),
  );
  if (options.seed !== false) await store.seed();
  let running: Promise<void> | undefined;
  const timer = options.runJobs
    ? setInterval(() => {
        if (running) return;
        running = runExports(store, options.failExports)
          .then(() =>
            options.webhookUrl
              ? deliverEvents(store, options.webhookUrl, process.env.WEBHOOK_SECRET ?? devSecret)
              : undefined,
          )
          .catch((error) => app.log.error(error))
          .finally(() => {
            running = undefined;
          });
      }, 100)
    : undefined;
  app.addHook("onClose", async () => {
    if (timer) clearInterval(timer);
    await running;
    await store.close();
  });
  await app.ready();
  return app;
}
