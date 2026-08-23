import { onTestFinished } from "vitest";
import assert from "node:assert";
import { eq } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import app from "../app.ts";
import * as schemas from "../db/schema.ts";

// Приложение собирается напрямую, а не через helper из fastify-cli. Тот грузит
// app.ts сам, в обход трансформации vite: из-за этого весь app в тестах был
// any, а покрытие показывало по обработчикам единицы процентов при живых
// тестах на них.
async function build(): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: { level: "error" } });
  // fp снимает инкапсуляцию, и декораторы приложения (db, jwt) видны снаружи.
  // В бою так не нужно — это только чтобы тесты могли дотянуться до базы.
  fastify.register(fp(app));
  await fastify.ready();

  onTestFinished(() => fastify.close());

  return fastify;
}

async function getAuthHeader(app: FastifyInstance, userId: number | null = null) {
  const from = app.db.select().from(schemas.users);
  const [client] = userId ? await from.where(eq(schemas.users.id, userId)) : await from.limit(1);
  assert.ok(client);
  const token = app.jwt.sign({ id: client.id });
  return {
    Authorization: `Bearer ${token}`,
  };
}

export { build, getAuthHeader };
