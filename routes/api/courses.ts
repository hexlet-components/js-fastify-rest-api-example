import { httpErrors } from "@fastify/sensible";
import { asc, eq } from "drizzle-orm";

import * as schemas from "../../db/schema.ts";
import { defineHandlers, ensure, getPagingOptions } from "../../lib/utils.ts";
import CoursePolicy from "../../policies/CoursePolicy.ts";
import CourseValidator from "../../validators/CourseValidator.ts";

const handlers = defineHandlers({
  async coursesIndex(request, reply) {
    const page = request.query?.page ?? 1;
    const courses = await request.db.query.courses.findMany({
      orderBy: asc(schemas.courses.id),
      ...getPagingOptions(page, 10),
    });
    return reply.code(200).send({ data: courses });
  },

  async coursesShow(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.id),
    });
    ensure(course, 404);
    return reply.code(200).send(course);
  },

  async coursesCreate(request, reply) {
    const validated = await CourseValidator.validateCreate(request.db, request.body);
    const values = {
      ...validated,
      creatorId: request.user.id,
    };

    const [course] = await request.db.insert(schemas.courses).values(values).returning();
    return reply.code(201).send(course);
  },

  // Курс читается до правки, а не правится сразу с returning: иначе проверить
  // владельца не на чем, и любой аутентифицированный менял чужой курс.
  async coursesUpdate(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.id),
    });
    ensure(course, 404);
    if (!CoursePolicy.canUpdate(course, request.user.id)) {
      throw httpErrors.forbidden("You can only change your own courses");
    }

    const validated = await CourseValidator.validateEdit(request.db, request.body);
    // Все поля CourseEditDTO необязательные, поэтому тело может оказаться
    // пустым. drizzle на пустом set бросает «No values to set» — это был 500.
    if (Object.keys(validated).length === 0) {
      return reply.code(200).send(course);
    }

    const [updated] = await request.db
      .update(schemas.courses)
      .set(validated)
      .where(eq(schemas.courses.id, request.params.id))
      .returning();
    return reply.code(200).send(updated);
  },

  async coursesDestroy(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.id),
    });
    ensure(course, 404);
    if (!CoursePolicy.canDestroy(course, request.user.id)) {
      throw httpErrors.forbidden("You can only delete your own courses");
    }

    await request.db.delete(schemas.courses).where(eq(schemas.courses.id, request.params.id));
    return reply.code(204).send();
  },
});

export default handlers;
