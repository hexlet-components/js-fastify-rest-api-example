import { defineConfig } from "@hey-api/openapi-ts";
export default defineConfig({
  input: "./starters/crud/tsp-output/@typespec/openapi3/openapi.json",
  output: { path: "./starters/crud/generated", module: { extension: ".ts" } },
  plugins: ["fastify", "@hey-api/typescript", "@hey-api/client-fetch", "@hey-api/sdk"],
});
