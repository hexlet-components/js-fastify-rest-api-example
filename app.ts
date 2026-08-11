import path from "node:path";
import type { AutoloadPluginOptions } from "@fastify/autoload";
import AutoLoad from "@fastify/autoload";
import type { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import glue from "fastify-openapi-glue";
import { ValiError } from "valibot";
import serviceHandlers from "./routes/index.ts";

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (error instanceof ValiError) {
      const errors = error.issues.map((issue) => {
        const lastPathItem =
          issue.path && issue.path.length > 0 ? issue.path[issue.path.length - 1] : undefined;
        const field =
          lastPathItem && "key" in lastPathItem && lastPathItem.key != null
            ? String(lastPathItem.key)
            : "";
        return {
          message: issue.message ?? "Validation error",
          rule: String(issue.type ?? "validation"),
          field,
        };
      });
      const errorDetail = {
        status: 422,
        title: "Validation Error",
        detail: "Errors related to business logic such as uniqueness",
        errors,
      };
      reply.type("application/problem+json").code(422).send(errorDetail);
    } else {
      reply.send(error);
    }
  });

  fastify.addContentTypeParser(
    "application/problem+json",
    { parseAs: "string" },
    fastify.getDefaultJsonParser("ignore", "ignore"),
  );

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  fastify.register(AutoLoad, {
    dir: path.join(import.meta.dirname, "plugins"),
    options: opts,
  });

  fastify.register(glue, {
    // prefix: 'v1',
    serviceHandlers,
    specification: "./tsp-output/@typespec/openapi3/openapi.v1.json",
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  // fastify.register(AutoLoad, {
  //   dir: path.join(import.meta.dirname, 'routes'),
  //   options: opts,
  // });
};

export default app;
export { app, options };
