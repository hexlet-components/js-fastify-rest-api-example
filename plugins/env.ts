import env from "@fastify/env";
import fp from "fastify-plugin";

// Конфиг проверяется схемой на старте: приложение с пустым JWT_SECRET не
// поднимется вовсе, вместо того чтобы молча подписывать токены строкой
// "supersecret", как было раньше.
const schema = {
  type: "object",
  required: ["JWT_SECRET"],
  properties: {
    JWT_SECRET: { type: "string", minLength: 32 },
    NODE_ENV: { type: "string", default: "development" },
    CORS_ORIGIN: { type: "string", default: "*" },
    // Лимит на IP в минуту. В тестах приложение поднимается десятки раз в одном
    // процессе, поэтому значение выносится наружу, а не зашивается в код.
    RATE_LIMIT_MAX: { type: "number", default: 100 },
  },
} as const;

export default fp(
  async (fastify) => {
    await fastify.register(env, { schema, dotenv: true });
  },
  { name: "env" },
);
