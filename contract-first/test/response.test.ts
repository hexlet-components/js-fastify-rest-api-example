import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import glue from "fastify-openapi-glue";
import responseValidator from "@fastify/response-validation";
import addFormats from "ajv-formats";
import specification from "../starters/minimal/tsp-output/@typespec/openapi3/openapi.json" with { type: "json" };
test("strict response validation rejects a wrong field type", async () => {
  const app = Fastify();
  await app.register(responseValidator, {
    responseStatusCodeValidation: true,
    ajv: {
      coerceTypes: false,
      removeAdditional: false,
      useDefaults: false,
      plugins: [addFormats.default],
    },
  });
  await app.register(glue, {
    specification,
    serviceHandlers: { getCourse: async () => ({ id: 1, title: 42, description: null }) },
  });
  try {
    const response = await app.inject("/courses/1");
    assert.equal(response.statusCode, 500);
    assert.match(response.body, /response\/title must be string/);
  } finally {
    await app.close();
  }
});
