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
    async function () {
      const users = await db.query.users.findMany()

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
