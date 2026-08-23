import { httpErrors } from "@fastify/sensible";
import { and, asc, eq } from "drizzle-orm";

import * as schemas from "../../../db/schema.ts";
import { defineHandlers, ensure, getPagingOptions } from "../../../lib/utils.ts";
import CoursePolicy from "../../../policies/CoursePolicy.ts";
import LessonValidator from "../../../validators/Course/LessonValidator.ts";

const handlers = defineHandlers({
  async coursesLessonsIndex(request, reply) {
    const page = request.query?.page ?? 1;
    const lessons = await request.db.query.courseLessons.findMany({
      where: eq(schemas.courseLessons.courseId, request.params.courseId),
      orderBy: asc(schemas.courseLessons.id),
      ...getPagingOptions(page, 10),
    });
    return reply.code(200).send({ data: lessons });
  },

  async coursesLessonsShow(request, reply) {
    const lesson = await request.db.query.courseLessons.findFirst({
      where: and(
        eq(schemas.courseLessons.courseId, request.params.courseId),
        eq(schemas.courseLessons.id, request.params.id),
      ),
    });
    ensure(lesson, 404);
    return reply.code(200).send(lesson);
  },

  // Урок добавляется в чужой курс, поэтому право проверяется по курсу. Раньше
  // хватало любого токена, а несуществующий курс упирался в ограничение
  // внешнего ключа и давал 500.
  async coursesLessonsCreate(request, reply) {
    const course = await request.db.query.courses.findFirst({
      where: eq(schemas.courses.id, request.params.courseId),
    });
    ensure(course, 404);
    if (!CoursePolicy.canAddLesson(course, request.user.id)) {
      throw httpErrors.forbidden("You can only add lessons to your own courses");
    }

    const validated = await LessonValidator.validateCreate(request.db, request.body);
    const values = {
      ...validated,
      courseId: request.params.courseId,
    };
    const [lesson] = await request.db.insert(schemas.courseLessons).values(values).returning();
    return reply.code(201).send(lesson);
  },
});

export default handlers;
