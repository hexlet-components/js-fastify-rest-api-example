import { asc, eq } from 'drizzle-orm'

import * as schemas from '../db/schema.js'
import { schema } from '../schema.js'

/**
  * @param {import('fastify').FastifyTypebox} fastify
  */
export default async function (fastify) {
  const db = fastify.db

  fastify.get(
    '/users',
    {
      schema: {
        querystring: schema['/users'].GET.args.properties.query,
      },
    },
    async function (request) {
      const perPage = 10
      const { page = 1 } = request.query
      const users = await db.query
        .users
        .findMany({
          orderBy: asc(schemas.users.id),
          limit: (perPage),
          offset: (page - 1) * perPage,
        })

      return users
    })

  fastify.get(
    '/users/:id',
    { schema: schema['/users/{id}'].GET.args.properties },
    async (request, reply) => {
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
      schema: {
        body: schema['/users'].POST.args.properties.body,
        response: { 201: schema['/users'].POST.data },
      },
    },
    async (request, reply) => {
      const [user] = await db.insert(schemas.users)
        .values(request.body)
        .returning({
          id: schemas.users.id,
          email: schemas.users.email,
          fullName: schemas.users.fullName,
        })

      return reply.code(201)
        .send(user)
    },
  )

  fastify.patch(
    '/users/:id',
    { schema: schema['/users/{id}'].PATCH.args.properties },
    async (request, reply) => {
      const user = await db.update(schemas.users)
        .set(request.body)
        .where(eq(schemas.users.id, request.params.id))
        .returning()
      fastify.assert(user, 404)

      return { id: request.params.id }
    },
  )

  fastify.delete(
    '/users/:id',
    { schema: schema['/users/{id}'].DELETE.args.properties },
    async (request, reply) => {
      const user = await db.delete(schemas.users)
        .where(eq(schemas.users.id, request.params.id))
        .returning()
      fastify.assert(user, 404)
      return reply.code(204).send()
    },
  )
}
