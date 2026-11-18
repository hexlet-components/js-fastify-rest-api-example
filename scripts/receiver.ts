import Fastify from "fastify";
import glue from "fastify-openapi-glue";
import { verify } from "../src/services.ts";
import { devSecret } from "../src/app.ts";
import specification from "../webhooks/tsp-output/@typespec/openapi3/openapi.json" with { type: "json" };
import type { RouteHandlers } from "../webhooks/generated/fastify.gen.ts";
import type { WebhookEvent } from "../webhooks/generated/types.gen.ts";
export async function buildReceiver(
  options: { secret?: string; fail?: boolean; onEvent?: (event: WebhookEvent) => void } = {},
) {
  const app = Fastify();
  const seen = new Set<string>();
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) =>
    done(null, body),
  );
  app.addHook("preValidation", async (request, reply) => {
    const raw = request.body as string;
    if (
      !verify(
        raw,
        String(request.headers["x-signature"] ?? ""),
        options.secret ?? process.env.WEBHOOK_SECRET ?? devSecret,
      )
    )
      return reply.code(401).send();
    try {
      request.body = JSON.parse(raw);
    } catch {
      return reply.code(400).send();
    }
  });
  const serviceHandlers = {
    async receiveEvent(request, reply) {
      const event = request.body;
      if (event.id !== request.headers["x-event-id"]) return reply.code(401).send();
      if (seen.has(event.id)) return reply.code(204).send();
      if (options.fail) return reply.code(503).send();
      options.onEvent?.(event);
      seen.add(event.id);
      return reply.code(204).send();
    },
  } satisfies RouteHandlers;
  await app.register(glue, { specification, serviceHandlers });
  await app.ready();
  return app;
}
if (process.argv[1] === import.meta.filename) {
  const app = await buildReceiver({
    fail: process.env.RECEIVER_FAIL === "true",
    onEvent: (event) => console.log(event),
  });
  await app.listen({ port: Number(process.env.RECEIVER_PORT ?? 4000), host: "127.0.0.1" });
  console.log(app.listeningOrigin + "/events");
}
