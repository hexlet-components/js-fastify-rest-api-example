import Database from "better-sqlite3";

import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fp from "fastify-plugin";
import * as schemas from "../db/schema.ts";
import seed from "../db/seeds.ts";

export default fp(async (fastify) => {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema: schemas });
  migrate(db, { migrationsFolder: "drizzle" });
  await seed(db);

  if (!fastify.hasRequestDecorator("db")) {
    fastify.decorate("db", db);
    fastify.decorateRequest("db", {
      getter() {
        return db; // общий singleton
      },
    });
  }
});
