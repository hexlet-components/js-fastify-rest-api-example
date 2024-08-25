import path from 'path'
import AutoLoad from '@fastify/autoload'
import fp from 'fastify-plugin'
import { TypeBoxValidatorCompiler } from '@fastify/type-provider-typebox'
import { errors } from '@vinejs/vine'

// Pass --options via CLI arguments in command to enable these options.
export const options = {}

/**
  * @param {import('fastify').FastifyInstance} fastify
  */
export default fp(async function (fastify, opts) {
  // Place here your custom code!

  const api = fastify
    .setValidatorCompiler(TypeBoxValidatorCompiler)
    .withTypeProvider()

  fastify.setErrorHandler(function (error, request, reply) {
    if (error instanceof errors.E_VALIDATION_ERROR) {
      const errorDetail = {
        status: 422,
        title: 'Validation Error',
        detail: 'Errors related to business logic such as uniqueness',
        errors: error.messages,
      }
      reply.code(422).send(errorDetail)
    }
    else {
      reply.send(error)
    }
  })

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  api.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'plugins'),
    options: Object.assign({}, opts),
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  api.register(AutoLoad, {
    dir: path.join(import.meta.dirname, 'routes'),
    options: Object.assign({}, opts),
  })

  // fastify.register(fastifySwagger, { openapi })
})
