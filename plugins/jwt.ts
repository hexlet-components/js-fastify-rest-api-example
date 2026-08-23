import jwtPlugin from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

// dependencies, а не расчёт на алфавитный порядок autoload: секрет берётся из
// проверенного конфига, и если env почему-то не загрузился, падать надо на
// старте, а не на первом подписанном токене.
export default fp(
  async (fastify: FastifyInstance) => {
    await fastify.register(jwtPlugin, {
      secret: fastify.config.JWT_SECRET,
    });
  },
  { name: "jwt", dependencies: ["env"] },
);
