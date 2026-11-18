import { defineConfig } from "@hey-api/openapi-ts";
export default defineConfig({
  input: "webhooks/tsp-output/@typespec/openapi3/openapi.json",
  output: { path: "webhooks/generated", module: { extension: ".ts" } },
  plugins: ["fastify", "@hey-api/typescript"],
});
