import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { buildServer } from "../src/app.ts";
const app = await buildServer();
await app.listen({ port: 0, host: "127.0.0.1" });
try {
  const status = await new Promise<number | null>((resolve, reject) => {
    const child = spawn(
      "uvx",
      [
        "schemathesis==4.33.4",
        "run",
        "tsp-output/@typespec/openapi3/openapi.json",
        "--url",
        app.listeningOrigin,
        "--include-method",
        "GET",
        "--include-path-regex",
        "^/courses",
        "--phases",
        "coverage,fuzzing",
        "--max-examples",
        "5",
        "--seed",
        "17",
        "--checks",
        "not_a_server_error,response_schema_conformance,content_type_conformance,status_code_conformance",
      ],
      { stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("exit", resolve);
  });
  assert.equal(status, 0);
} finally {
  await app.close();
}
