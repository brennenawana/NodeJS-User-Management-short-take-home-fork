import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "./config.js";

test("defaults to the offline fixture provider and a json file", () => {
  assert.deepEqual(loadConfig({}), { port: 8080, locationProvider: "fixture", storage: "json-file" });
});

test("reads every variable", () => {
  assert.deepEqual(loadConfig({ PORT: "3000", LOCATION_PROVIDER: "google", STORAGE: "memory" }), {
    port: 3000, locationProvider: "google", storage: "memory",
  });
});

test("names the bad variable", () => {
  assert.throws(() => loadConfig({ LOCATION_PROVIDER: "mapquest" }), /LOCATION_PROVIDER/);
  assert.throws(() => loadConfig({ PORT: "eighty" }), /PORT/);
});
