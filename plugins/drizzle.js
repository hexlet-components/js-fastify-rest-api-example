import fp from 'fastify-plugin'

import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import seed from '../db/seeds.js'

import * as schemas from '../db/schema.js'

export default fp(async function (fastify) {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema: schemas })
  migrate(db, { migrationsFolder: 'drizzle' })
  seed(db)

  if (!fastify.db) {
    fastify.decorate('db', db)
    fastify.addHook('onClose', () => {
      sqlite.close()
    })
  }
})
