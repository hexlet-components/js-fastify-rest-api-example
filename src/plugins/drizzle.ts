import { PGlite } from "@electric-sql/pglite";

import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import fp from "fastify-plugin";
import * as schemas from "../db/schema.ts";

export default fp(
  async (fastify) => {
    // PGlite без аргументов — postgres в памяти процесса, отдельного сервиса
    // по-прежнему нет. Взят ради нативных типов: timestamptz в схеме это
    // время, а не integer, которому смысл придаёт кодек drizzle.
    const client = new PGlite();
    const db = drizzle(client, { schema: schemas });
    await migrate(db, { migrationsFolder: "drizzle" });

    // Инстанс закрывается вместе с приложением: в отличие от sqlite :memory:,
    // за каждым PGlite стоит wasm-куча в десятки мегабайт, а тесты поднимают
    // приложение десятки раз в одном процессе.
    fastify.addHook("onClose", () => client.close());

    // Сиды — инструмент разработки, и импорт у них динамический не для красоты:
    // db/seeds.ts тянет @faker-js/faker из devDependencies, поэтому со
    // статическим импортом боевая установка не поднималась вовсе
    // («Cannot find package '@faker-js/faker'»). А если бы поднялась — завела бы
    // в базе трёх выдуманных пользователей.
    if (fastify.config.NODE_ENV !== "production") {
      const { default: seed } = await import("../db/seeds.ts");
      await seed(db);
    }

    if (!fastify.hasRequestDecorator("db")) {
      fastify.decorate("db", db);
      fastify.decorateRequest("db", {
        getter() {
          return db; // общий singleton
        },
      });
    }
  },
  // Зависимость от env объявлена явно: по алфавиту autoload грузит drizzle
  // раньше env, и fastify.config к этому моменту не существовало бы.
  { name: "drizzle", dependencies: ["env"] },
);
