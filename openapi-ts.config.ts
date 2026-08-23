import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./tsp-output/@typespec/openapi3/openapi.v1.json",
  output: "types/handlers",
  plugins: [
    // Типы обработчиков для defineHandlers и схемы zod для бизнес-валидации:
    // валидаторы расширяют сгенерированную схему вместо своей копии контракта.
    "fastify",
    "zod",
    // Клиент из той же спеки — им ходят тесты, чтобы не писать URL и методы
    // руками.
    "@hey-api/client-fetch",
    "@hey-api/sdk",
  ],
});
