import { buildCourse, buildCourseLesson, buildUserRecord } from "../lib/data.ts";
import type { DrizzleDB } from "../types/index.ts";
import * as schemas from "./schema.ts";

export default async (db: DrizzleDB) => {
  const [_user1] = await db
    .insert(schemas.users)
    .values(await buildUserRecord())
    .returning();
  const [user2] = await db
    .insert(schemas.users)
    .values(await buildUserRecord())
    .returning();
  const [_user3] = await db
    .insert(schemas.users)
    .values(
      await buildUserRecord({
        email: "support@hexlet.io",
        fullName: "Тото Поддерживающий",
      }),
    )
    .returning();
  const [_course1] = await db
    .insert(schemas.courses)
    .values(buildCourse({ creatorId: user2.id }))
    .returning();
  const [course2] = await db
    .insert(schemas.courses)
    .values(buildCourse({ creatorId: user2.id }))
    .returning();
  await db.insert(schemas.courseLessons).values(buildCourseLesson({ courseId: course2.id }));
};
