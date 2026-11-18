import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./tsp-output/@typespec/openapi3/openapi.json",
  output: { path: "./generated", importFileExtension: ".ts" },
  plugins: ["fastify", "@hey-api/typescript", "@hey-api/client-fetch", "@hey-api/sdk"],
});
