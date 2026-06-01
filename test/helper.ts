import { onTestFinished } from 'vitest'
import assert from 'node:assert'
import helper from 'fastify-cli/helper.js'
import path from 'path'
import { fileURLToPath } from 'url'
import * as schemas from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

const AppPath = path.join(import.meta.dirname, '..', 'app.ts')

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {
    skipOverride: true
  }
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

async function build() {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await helper.build(argv, config(), serverConfig())

  // tear down our app after we are done
  onTestFinished(() => app.close())

  return app
}

async function getAuthHeader(app: FastifyInstance, userId: number | null = null) {
  const from = app.db.select().from(schemas.users)
  const [client] = userId ? await from.where(eq(schemas.users.id, userId)) : await from.limit(1)
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
