import { onTestFinished } from "vitest";
import assert from "node:assert";
import { eq } from "drizzle-orm";
import Fastify, { type FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import app from "../app.ts";
import * as schemas from "../db/schema.ts";
import { createClient, createConfig } from "../types/handlers/client/index.js";

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

// Клиент, сгенерированный из той же спеки. Нужен настоящий сокет: SDK ходит
// через fetch, а не через inject.
//
// Правило, по которому тесты разделены между buildClient() и build():
// корректные запросы идут клиентом — URL, методы и формы тел тогда берутся из
// контракта, а не переписываются руками. Запросы, нарушающие контракт
// (страница вне диапазона, слишком короткое имя, обращение без токена),
// остаются на app.inject(): клиент типизирован по спеке и выразить их просто
// не даёт, а проверять их надо.
async function buildClient() {
  const app = await build();
  await app.listen({ port: 0, host: "127.0.0.1" });

  const address = app.server.address();
  assert.ok(address && typeof address === "object");
  const client = createClient(createConfig({ baseUrl: `http://127.0.0.1:${address.port}` }));

  return { app, client };
}

// У SDK response необязателен: при сетевой ошибке его не будет. Тесты про
// статусы, поэтому проверяем наличие один раз здесь.
function responseOf(result: { response?: Response }): Response {
  assert.ok(result.response, "client returned no response");
  return result.response;
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

export { build, buildClient, getAuthHeader, responseOf };
