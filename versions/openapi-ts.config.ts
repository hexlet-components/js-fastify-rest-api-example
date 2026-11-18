import { defineConfig } from "@hey-api/openapi-ts";
export default defineConfig(
  ["V1", "V2"].map((version) => ({
    input: `versions/tsp-output/@typespec/openapi3/${version}.json`,
    output: { path: `versions/${version.toLowerCase()}`, module: { extension: ".ts" } },
    plugins: ["fastify", "@hey-api/typescript", "@hey-api/client-fetch", "@hey-api/sdk"],
  })),
);
