import { asc, eq } from 'drizzle-orm'

import * as schemas from '../../db/schema.js'
import { schema } from '../../schema.js'
import { getPagingOptions } from '../../lib/utils.js'
import User from '../../models/User.js'

/**
  * @param {import('fastify').FastifyTypebox} fastify
  */
export default async function (fastify) {
  const db = fastify.db

  fastify.get(
    '/users',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: schema['/users'].GET.args.properties.query,
      },
    },
    async function (request) {
      const { page = 1 } = request.query
      const users = await db.query
        .users
        .findMany({
          orderBy: asc(schemas.users.id),
          ...getPagingOptions(page),
        })

      return users
    })

  fastify.get(
    '/users/:id',
    {
      onRequest: [fastify.authenticate],
      schema: schema['/users/{id}'].GET.args.properties,
    },
    async (request) => {
      const user = await db.query.users.findFirst({
        where: eq(schemas.users.id, request.params.id),
      })
      fastify.assert(user, 404)
      return { id: request.params.id }
    },
  )

  fastify.post(
    '/users',
    {
      onRequest: [fastify.authenticate],
      schema: {
        body: schema['/users'].POST.args.properties.body,
        response: {
          201: schema['/users'].POST.data,
          422: schema['/users'].POST.error,
        },
      },
    },
    async (request, reply) => {
      const validated = await User.validate(db, request.body)

      const [user] = await db.insert(schemas.users)
        .values(validated)
        .returning()

      return reply.code(201)
        .send(user)
    },
  )

  fastify.patch(
    '/users/:id',
    {
      onRequest: [fastify.authenticate],
      schema: schema['/users/{id}'].PATCH.args.properties,
    },
    async (request) => {
      const [user] = await db.update(schemas.users)
        .set(request.body)
        .where(eq(schemas.users.id, request.params.id))
        .returning()
      fastify.assert(user, 404)

      return user
    },
  )

  fastify.delete(
    '/users/:id',
    {
      onRequest: [fastify.authenticate],
      schema: schema['/users/{id}'].DELETE.args.properties,
    },
    async (request, reply) => {
      const [user] = await db.delete(schemas.users)
        .where(eq(schemas.users.id, request.params.id))
        .returning()
      fastify.assert(user, 404)
      return reply.code(204).send()
    },
  )
}
