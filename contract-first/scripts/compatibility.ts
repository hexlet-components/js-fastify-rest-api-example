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
const dir = await mkdtemp(join(tmpdir(), "catalog-breaking-"));
const native = spawnSync("oasdiff", ["--version"], { encoding: "utf8" });
const docker = process.env.OASDIFF_DOCKER === "true" || native.status !== 0;
const image =
  "tufin/oasdiff:v1.34.1@sha256:67a23cfea7d251e2ae34ee703ac8733c5d96bc2e7b90fd0f4d475ec99367b85f";
function compare(revision: string) {
  const args = ["breaking", baseline, revision, "--fail-on", "ERR"];
  if (!docker) return spawnSync("oasdiff", args, { encoding: "utf8" });
  return spawnSync(
    "docker",
    [
      "run",
      "--rm",
      "--mount",
      `type=bind,src=${process.cwd()},dst=${process.cwd()},readonly`,
      "--mount",
      `type=bind,src=${dir},dst=${dir},readonly`,
      "--workdir",
      process.cwd(),
      image,
      ...args,
    ],
    { encoding: "utf8" },
  );
}
try {
  console.log(docker ? `Comparing with Docker ${image}` : "Comparing with oasdiff from PATH");
  const diff = compare(current);
  if (diff.error)
    throw new Error("Start Docker or install oasdiff before running compatibility", {
      cause: diff.error,
    });
  assert.equal(diff.status, 0, diff.stdout + diff.stderr);
  const broken = JSON.parse(await readFile(current, "utf8"));
  delete broken.paths["/courses/{courseId}"].get;
  const path = join(dir, "broken.json");
  await writeFile(path, JSON.stringify(broken));
  const failure = compare(path);
  assert.equal(failure.status, 1, failure.stdout + failure.stderr);
  assert.match(failure.stdout, /removed|deleted/i);
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
