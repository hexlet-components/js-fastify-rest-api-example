import { createStore } from "../src/db.ts";
const store = await createStore();
try {
  const title = "Pagination duplicate";
  const existing = await store.pool.query(
    "SELECT count(*) FROM courses WHERE title=$1 AND owner_id=1",
    [title],
  );
  for (let index = Number(existing.rows[0].count); index < 2; index++)
    await store.createCourse({ title, description: "Pagination fixture" }, 1);
  for (const name of ["Pagination first", "Pagination last"])
    if (
      !(await store.pool.query("SELECT id FROM courses WHERE title=$1 AND owner_id=1", [name]))
        .rowCount
    )
      await store.createCourse({ title: name, description: "Pagination fixture" }, 1);
  console.log(
    "Four Pagination fixtures available, including two courses titled Pagination duplicate",
  );
} finally {
  await store.close();
}
