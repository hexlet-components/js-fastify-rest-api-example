import fp from 'fastify-plugin'
import bearerAuthPlugin from '@fastify/bearer-auth'

const keys = new Set(['secret-key'])

export default fp(async (fastify) => {
  fastify.register(bearerAuthPlugin, {
    keys,
    addHook: false,
  })
})
