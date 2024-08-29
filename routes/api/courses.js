import { asc, eq } from 'drizzle-orm'

import * as schemas from '../../db/schema.js'
import { schema } from '../../schema.js'
import { getPagingOptions } from '../../lib/utils.js'
import Course from '../../models/Course.js'

/**
  * @param {import('fastify').FastifyTypebox} fastify
  */
export default async function (fastify) {
  const db = fastify.db

  fastify.get(
    '/courses',
    {
      schema: {
        querystring: schema['/courses'].GET.args.properties.query,
      },
    },
    async function (request) {
      const { page = 1 } = request.query
      const courses = await db.query
        .courses
        .findMany({
          orderBy: asc(schemas.courses.id),
          ...getPagingOptions(page),
        })

      return courses
    })

  fastify.get(
    '/courses/:id',
    { schema: schema['/courses/{id}'].GET.args.properties },
    async (request) => {
      const course = await db.query.courses.findFirst({
        where: eq(schemas.courses.id, request.params.id),
      })
      fastify.assert(course, 404)
      return { id: request.params.id }
    },
  )

  fastify.post(
    '/courses',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: schema['/courses'].POST.args.properties.body,
        response: {
          201: schema['/courses'].POST.data,
          422: schema['/courses'].POST.error,
        },
      },
    },
    async (request, reply) => {
      const validated = await Course.validate(db, request.body)

      const [course] = await db.insert(schemas.courses)
        .values(validated)
        .returning()

      return reply.code(201)
        .send(course)
    },
  )

  fastify.patch(
    '/courses/:id',
    {
      onRequest: [fastify.authenticate],
      schema: schema['/courses/{id}'].PATCH.args.properties,
    },
    async (request) => {
      const course = await db.query.courses.findFirst({
        where: eq(schemas.courses.id, request.params.id),
      })
      fastify.assert(course, 404)

      fastify.assert.equal(request.user.id, course?.creatorId, 403)
      await db.update(schemas.courses)
        .set(request.body)
        .where(eq(schemas.courses.id, request.params.id))

      return { id: request.params.id }
    },
  )

  fastify.delete(
    '/courses/:id',
    {
      onRequest: [fastify.authenticate],
      schema: schema['/courses/{id}'].DELETE.args.properties,
    },
    async (request, reply) => {
      const user = await db.delete(schemas.courses)
        .where(eq(schemas.courses.id, request.params.id))
        .returning()
      fastify.assert(user, 404)
      return reply.code(204).send()
    },
  )
}
