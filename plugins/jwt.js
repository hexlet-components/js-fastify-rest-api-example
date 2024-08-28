import fp from 'fastify-plugin'
import jwtPlugin from '@fastify/jwt'

export default fp(async (fastify) => {
  fastify.register(jwtPlugin, {
    secret: 'supersecret',
  })
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify()
    }
    catch (err) {
      reply.send(err)
    }
  })
})
