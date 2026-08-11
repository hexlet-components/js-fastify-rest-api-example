import responseValidation from "@fastify/response-validation";
import fp from "fastify-plugin";

export default fp(async (fastify) => {
  await fastify.register(responseValidation);
});
