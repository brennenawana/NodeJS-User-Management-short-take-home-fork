import { test } from "node:test";
import assert from "node:assert/strict";
import { appFromEnv } from "./compose.js";

test("builds a working app from the environment alone", async () => {
  const { app, config } = appFromEnv({ STORAGE: "memory", LOCATION_PROVIDER: "sample" });
  assert.equal(config.storage, "memory");
  const server = app.listen(0);
  try {
    const { port } = server.address() as { port: number };
    const created = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Lena", zip: "02108" }),
    });
    assert.equal((await created.json()).city, "Boston");
  } finally {
    server.close();
  }
});

test("names what's missing when a plugin isn't configured", () => {
  assert.throws(() => appFromEnv({ STORAGE: "upstash-redis" }), /KV_REST_API_URL/);
});
