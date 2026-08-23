import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import fp from "fastify-plugin";

export default fp(
  async (fastify) => {
    // contentSecurityPolicy выключен: API отдаёт JSON, а страницу
    // документации Scalar собирает инлайновыми стилями и скриптом, и дефолтный
    // CSP её ломает.
    await fastify.register(helmet, { contentSecurityPolicy: false });

    await fastify.register(cors, { origin: fastify.config.CORS_ORIGIN });

    await fastify.register(rateLimit, {
      max: fastify.config.RATE_LIMIT_MAX,
      timeWindow: "1 minute",
    });
  },
  { name: "security", dependencies: ["env"] },
);
