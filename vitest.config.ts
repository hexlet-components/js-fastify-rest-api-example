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
    },
  },
});
