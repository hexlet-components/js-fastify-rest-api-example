import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,js}"],
    env: {
      // Боевая цена scrypt — ~230 мс на хеш, а сиды прогоняются на каждый
      // build(). Стоимость лежит внутри дайджеста, так что проверка от этого
      // не ломается.
      SCRYPT_COST: "1024",
      // Схема в plugins/env.ts требует секрет, и это правильно: приложение не
      // должно подниматься с пустым. Тестам он нужен любой.
      JWT_SECRET: "test-secret-not-used-anywhere-else-0123456789",
      // Лимитер живёт в памяти каждого поднятого приложения, но потолок лучше
      // задрать: иначе тест, который шлёт много запросов, начнёт ловить 429.
      RATE_LIMIT_MAX: "100000",
    },
  },
});
