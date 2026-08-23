import jwtPlugin from "@fastify/jwt";
import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(jwtPlugin, {
    secret: "supersecret",
  });
});
