import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildServer } from "../src/app.ts";
import { createClient } from "../baseline/sdk/client/index.ts";
import { getCourse } from "../baseline/sdk/sdk.gen.ts";
const current = "tsp-output/@typespec/openapi3/openapi.json";
const baseline = "baseline/openapi.json";
const diff = spawnSync("oasdiff", ["breaking", baseline, current, "--fail-on", "ERR"], {
  encoding: "utf8",
});
if (diff.error)
  throw new Error("Install oasdiff before running compatibility", { cause: diff.error });
assert.equal(diff.status, 0, diff.stdout + diff.stderr);
const dir = await mkdtemp(join(tmpdir(), "catalog-breaking-"));
try {
  const broken = JSON.parse(await readFile(current, "utf8"));
  delete broken.paths["/courses/{courseId}"].get;
  const path = join(dir, "broken.json");
  await writeFile(path, JSON.stringify(broken));
  const failure = spawnSync("oasdiff", ["breaking", baseline, path, "--fail-on", "ERR"], {
    encoding: "utf8",
  });
  assert.notEqual(failure.status, 0, "oasdiff must reject a removed operation");
  console.log("oasdiff rejects removed operation");
} finally {
  await rm(dir, { recursive: true });
}
const app = await buildServer();
try {
  const client = createClient({
    baseUrl: "http://catalog",
    fetch: async (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      const response = await app.inject({ method: "GET", url: url.pathname + url.search });
      return new Response(response.body, {
        status: response.statusCode,
        headers: response.headers as HeadersInit,
      });
    },
  });
  const result = await getCourse({ client, path: { courseId: 1 } });
  assert.equal(result.response!.status, 200);
  assert.equal(result.data?.id, 1);
  console.log("Frozen SDK reads current server");
} finally {
  await app.close();
}
