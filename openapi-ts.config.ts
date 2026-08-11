import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./tsp-output/@typespec/openapi3/openapi.v1.json",
  output: "types/handlers",
  plugins: [
    // ...other plugins
    "fastify",
  ],
});
