import { httpErrors } from "@fastify/sensible";
import { asc, count, eq } from "drizzle-orm";

import * as schemas from "../../db/schema.ts";
import { ensureMatches, entityTag } from "../../lib/etag.ts";
import { buildPageMeta, defineHandlers, ensure, getPagingOptions } from "../../lib/utils.ts";
import CoursePolicy from "../../policies/CoursePolicy.ts";
import CourseValidator from "../../validators/CourseValidator.ts";

const handlers = defineHandlers({
  async coursesIndex(request, reply) {
    const page = request.query?.page ?? 1;
    const perPage = request.query?.perPage ?? 10;

    const courses = await request.db.query.courses.findMany({
      orderBy: asc(schemas.courses.id),
      ...getPagingOptions(page, perPage),
    });
    const [{ total }] = await request.db.select({ total: count() }).from(schemas.courses);

    return reply.code(200).send({ data: courses, meta: buildPageMeta(page, perPage, total) });
  },

  async coursesShow(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.id),
    });
    ensure(course, 404);
    // ETag выставляется здесь, чтобы @fastify/etag не считал его по телу:
    // клиенту нужен валидатор, который потом можно прислать в If-Match.
    return reply.header("etag", entityTag(course.updatedAt)).code(200).send(course);
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
    ensureMatches(request.headers["if-match"], course.updatedAt);

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
    return reply.header("etag", entityTag(updated.updatedAt)).code(200).send(updated);
  },

  async coursesDestroy(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.id),
    });
    ensure(course, 404);
    if (!CoursePolicy.canDestroy(course, request.user.id)) {
      throw httpErrors.forbidden("You can only delete your own courses");
    }
    ensureMatches(request.headers["if-match"], course.updatedAt);

    // Уроки удаляются явно и в одной транзакции с курсом, а не каскадом из
    // миграции: урок вне курса не существует, но поведение должно быть видно в
    // коде и покрыто тестом, а не спрятано в DDL.
    await request.db.transaction(async (tx) => {
      await tx
        .delete(schemas.courseLessons)
        .where(eq(schemas.courseLessons.courseId, request.params.id));
      await tx.delete(schemas.courses).where(eq(schemas.courses.id, request.params.id));
    });
    return reply.code(204).send();
  },
});

export default handlers;
