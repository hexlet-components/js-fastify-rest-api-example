import jwtPlugin from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

export default fp(async (fastify: FastifyInstance) => {
  fastify.register(jwtPlugin, {
    secret: "supersecret",
  });
  fastify.decorate(
    "authenticate",
    async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  );
});
