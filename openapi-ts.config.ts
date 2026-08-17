import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./tsp-output/@typespec/openapi3/openapi.v1.json",
  output: "types/handlers",
  plugins: [
    // Типы обработчиков для defineHandlers и схемы zod для бизнес-валидации:
    // валидаторы расширяют сгенерированную схему вместо своей копии контракта.
    "fastify",
    "zod",
  ],
});
