import { faker } from '@faker-js/faker'

import * as schemas from './schema.js'
/**
 * @param {import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schemas>} db
 */
export default async (db) => {
  await db.insert(schemas.users).values(
    {
      email: faker.internet.email(),
      fullName: faker.person.fullName(),
    },
  )
}
