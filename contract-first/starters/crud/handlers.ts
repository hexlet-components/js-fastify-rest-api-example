import type { RouteHandlers } from "./generated/fastify.gen.ts";
import type { Store } from "./db.ts";

function notFound(): never {
  throw Object.assign(new Error("Course not found"), { statusCode: 404 });
}
export function createHandlers(store: Store) {
  return {
    async listCourses(_request, reply) {
      return reply.code(200).send(await store.listCourses());
    },
    async getCourse(request, reply) {
      const course = await store.getCourse(request.params.courseId);
      if (!course) notFound();
      return reply.code(200).send(course);
    },
    async createCourse(request, reply) {
      const course = await store.createCourse(request.body);
      return reply.header("Location", `/courses/${course.id}`).code(201).send(course);
    },
    async updateCourse(request, reply) {
      const course = await store.updateCourse(request.params.courseId, request.body);
      if (!course) notFound();
      return reply.code(200).send(course);
    },
    async deleteCourse(request, reply) {
      const course = await store.deleteCourse(request.params.courseId);
      if (!course) notFound();
      return reply.code(204).send();
    },
  } satisfies RouteHandlers;
}
