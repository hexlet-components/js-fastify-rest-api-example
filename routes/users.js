import { eq } from 'drizzle-orm'

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
      if (!user) {
        return reply.callNotFound()
      }
      return { id: request.params.id }
    },
  )
}
