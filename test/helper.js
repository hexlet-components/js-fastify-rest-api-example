// This file contains code that we reuse
// between our tests.

import assert from 'assert'
import helper from 'fastify-cli/helper.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AppPath = path.join(__dirname, '..', 'app.js')

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {}
}

function serverConfig() {
  return {
    logger: {
      level: 'error',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
        },
      },
    },
  }
}

/**
  * @returns {Promise<import('fastify').FastifyInstance>}
  */
async function build(t) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await helper.build(argv, config(), serverConfig())

  // tear down our app after we are done
  t.after(() => app.close())

  return app
}

/**
  * @param {import('fastify').FastifyInstance} app
  */
async function getAuthHeader(app) {
  const client = await app.db.query.users.findFirst()
  assert.ok(client)
  const token = app.jwt.sign({ id: client.id })
  return {
    Authorization: `Bearer ${token}`,
  }
}

export {
  config,
  build,
  getAuthHeader,
}
