import { test } from "vitest";
import * as assert from "node:assert";
import { eq } from "drizzle-orm";
import { build } from "../helper.ts";
import { buildUserRecord } from "../../src/lib/data.ts";
import * as schemas from "../../src/db/schema.ts";

// updatedAt не писался никогда: обработчики его не трогали, а SQL-дефолт
// срабатывает только на INSERT. Теперь его ведёт drizzle через $onUpdate.
test("updatedAt moves on update and createdAt stays put", async () => {
  const app = await build();

  // Отметка ставится заведомо старой, а не через паузу в тесте: ждать, пока
  // часы уйдут вперёд, ради одного сравнения — плохой обмен.
  const past = new Date("2020-01-01T00:00:00Z");
  const [user] = await app.db
    .insert(schemas.users)
    .values({ ...(await buildUserRecord()), createdAt: past, updatedAt: past })
    .returning();

  assert.ok(user.createdAt instanceof Date, `createdAt is ${typeof user.createdAt}`);
  assert.equal(user.updatedAt.getTime(), past.getTime());

  const [updated] = await app.db
    .update(schemas.users)
    .set({ fullName: "Renamed Person" })
    .where(eq(schemas.users.id, user.id))
    .returning();

  assert.ok(
    updated.updatedAt.getTime() > past.getTime(),
    `updatedAt did not move: ${updated.updatedAt.toISOString()}`,
  );
  assert.equal(updated.createdAt.getTime(), past.getTime());
});
