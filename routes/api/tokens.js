import { eq } from 'drizzle-orm'
import { schema } from '../../schema.js'
import * as schemas from '../../db/schema.js'

/**
  * @param {import('fastify').FastifyTypebox} fastify
  */
export default async function (fastify) {
  const db = fastify.db

  const postTokens = schema['/tokens'].POST
  fastify.post(
    '/tokens',
    {
      // preHandler: fastify.verifyBearerAuth,
      schema: {
        body: postTokens.args.properties.body,
        response: {
          201: postTokens.data,
          422: postTokens.error,
        },
      },
    },
    async (request, reply) => {
      const client = await db.query.users.findFirst({
        // Добавить проверку пароля
        where: eq(schemas.users.email, request.body.email),
      })
      fastify.assert.ok(client, 404)
      const token = fastify.jwt.sign({ id: client.id })
      return reply.code(201)
        .send({ token })
    },
  )
}
