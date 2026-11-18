import type { RouteHandlers } from "./generated/fastify.gen.ts";
export const handlers = {
  async getCourse(request, reply) {
    if (request.params.courseId !== 1)
      return reply.type("application/problem+json").code(404).send({
        type: "https://example.org/problems/not-found",
        title: "Course not found",
        status: 404,
        detail: "No course with this id",
      });
    return reply.code(200).send({ id: 1, title: "HTTP", description: null });
  },
} satisfies RouteHandlers;
