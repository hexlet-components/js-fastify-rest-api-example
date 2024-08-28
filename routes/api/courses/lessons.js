import { and, asc, eq } from 'drizzle-orm'

import * as schemas from '../../../db/schema.js'
import { schema } from '../../../schema.js'
import { getPagingOptions } from '../../../lib/utils.js'
import Lesson from '../../../models/Course/Lesson.js'

/**
  * @param {import('fastify').FastifyTypebox} fastify
  */
export default async function (fastify) {
  const db = fastify.db

  fastify.get(
    '/courses/:courseId/lessons',
    {
      schema: {
        params: schema['/courses/{courseId}/lessons'].GET.args.properties.params,
        querystring: schema['/courses/{courseId}/lessons'].GET.args.properties.query,
      },
    },
    async function (request) {
      const { page = 1 } = request.query
      const courses = await db.query
        .courseLessons
        .findMany({
          where: eq(schemas.courseLessons, request.params.courseId),
          orderBy: asc(schemas.courseLessons.id),
          ...getPagingOptions(page),
        })

      return courses
    })

  fastify.get(
    '/courses/:courseId/lessons/:id',
    {
      schema: schema['/courses/{courseId}/lessons/{id}'].GET.args.properties,
    },
    async (request) => {
      const course = await db.query.courses.findFirst({
        where: and(
          eq(schemas.courses.id, request.params.courseId),
          eq(schemas.courseLessons.id, request.params.id),
        ),
      })
      fastify.assert(course, 404)
      return { id: request.params.id }
    },
  )

  const postLessons = schema['/courses/{courseId}/lessons'].POST
  fastify.post(
    '/courses/:courseId/lessons',
    {
      preHandler: fastify.verifyBearerAuth,
      schema: {
        params: postLessons.args.properties.params,
        body: postLessons.args.properties.body,
        response: {
          201: postLessons.data,
          422: postLessons.error,
        },
      },
    },
    async (request, reply) => {
      const validated = await Lesson.validate(db, request.body)
      validated.courseId = request.params.courseId

      const [lesson] = await db.insert(schemas.courseLessons)
        .values(validated)
        .returning()

      return reply.code(201)
        .send(lesson)
    },
  )
}
