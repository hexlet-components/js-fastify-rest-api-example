import { schema } from '../../schema.js'

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
    async (_request, reply) => {
      const client = await db.query.users.findFirst()
      fastify.assert.ok(client)
      const token = fastify.jwt.sign({ user: { id: client.id } })
      return reply.code(201)
        .send({ token })
    },
  )
}
