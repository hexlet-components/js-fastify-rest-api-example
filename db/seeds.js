import * as schemas from './schema.js'
import { buildCourse, buildCourseLesson, buildUser } from '../lib/data.js'
/**
 * @param {import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schemas>} db
 */
export default async (db) => {
  const [_user1] = await db.insert(schemas.users).values(buildUser()).returning()
  const [user2] = await db.insert(schemas.users).values(buildUser()).returning()
  const [_course1] = await db.insert(schemas.courses).values(
    buildCourse({ creatorId: user2.id }),
  ).returning()
  const [course2] = await db.insert(schemas.courses).values(
    buildCourse({ creatorId: user2.id }),
  ).returning()
  await db.insert(schemas.courseLessons).values(
    buildCourseLesson({ courseId: course2.id }),
  )
}
