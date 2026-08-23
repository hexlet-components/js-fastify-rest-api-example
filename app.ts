import { STATUS_CODES } from "node:http";
import path from "node:path";
import { httpErrors } from "@fastify/sensible";
import { eq } from "drizzle-orm";
import type { AutoloadPluginOptions } from "@fastify/autoload";
import AutoLoad from "@fastify/autoload";
import type { FastifyPluginAsync, FastifyRequest, FastifyServerOptions } from "fastify";
import glue from "fastify-openapi-glue";
import * as z from "zod";
import * as schemas from "./db/schema.ts";
import serviceHandlers from "./routes/index.ts";

export interface AppOptions extends FastifyServerOptions, Partial<AutoloadPluginOptions> {}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (fastify, opts): Promise<void> => {
  // Все модели ошибок в контракте наследуют ProblemDetails (RFC 9457), поэтому
  // и отдавать их надо в этом виде. Раньше так уходил только ZodError, а
  // остальное — дефолтным форматом fastify: пока 404 не наступал никогда, это
  // было незаметно.
  fastify.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => ({
        message: issue.message,
        rule: issue.code,
        field: issue.path.map(String).join("."),
      }));
      const errorDetail = {
        status: 422,
        title: "Validation Error",
        detail: "Errors related to business logic such as uniqueness",
        errors,
      };
      reply.type("application/problem+json").code(422).send(errorDetail);
      return;
    }

    const status = typeof error.statusCode === "number" ? error.statusCode : 500;
    reply
      .type("application/problem+json")
      .code(status)
      .send({
        status,
        title: STATUS_CODES[status] ?? "Error",
        // Текст ошибки 5xx наружу не уходит: он может содержать что угодно,
        // вплоть до фрагмента запроса к базе.
        detail: status >= 500 ? "Internal Server Error" : error.message,
      });
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

  // Авторизацию навешивает glue по `security` из спеки, сопоставляя имя
  // обработчика с именем схемы (BearerAuth). Руками её писать нельзя: пока
  // jwtVerify вызывался в каждом обработчике, во всех пяти операциях /users
  // его забыли, и список, правка и удаление пользователей были открыты.
  fastify.register(glue, {
    // prefix: 'v1',
    serviceHandlers,
    securityHandlers: {
      BearerAuth: async (request: FastifyRequest) => {
        await request.jwtVerify();

        // Токен живёт до истечения срока, а пользователя за это время могли
        // удалить. Без проверки запрос шёл дальше с идентификатором, которого
        // в базе нет, и падал на внешнем ключе уже в обработчике.
        const user = await request.db.query.users.findFirst({
          columns: { id: true },
          where: eq(schemas.users.id, request.user.id),
        });
        if (!user) {
          throw httpErrors.unauthorized("Token refers to a user that no longer exists");
        }
      },
    },
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
