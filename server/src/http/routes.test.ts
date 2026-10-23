import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { buildApp } from "../app.js";
import { createMemoryRepo } from "../storage/memory/index.js";
import { BOSTON, DENVER, fakeProvider, fixedClock, sequentialIds } from "../core/fakes.js";

const T0 = "2026-10-19T16:50:00.000Z";

describe("http api", () => {
  let server: Server;
  let base: string;
  let lookups: ReturnType<typeof fakeProvider>;
  let app: ReturnType<typeof buildApp> | undefined;

  const call = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(base + path, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: typeof body === "string" ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  };

  before(async () => {
    server = (await import("node:http")).createServer((req, res) => app!(req, res));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  beforeEach(() => {
    lookups = fakeProvider({ "02108": BOSTON, "80202": DENVER, "99999": "down" });
    app = buildApp({ repo: createMemoryRepo(), locationProvider: lookups.provider, clock: fixedClock(T0), newId: sequentialIds() });
  });

  test("POST creates a located user", async () => {
    const res = await call("POST", "/api/users", { name: "Lena Hoffmann", zip: "02108" });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { id: "u1", name: "Lena Hoffmann", zip: "02108", ...BOSTON, locationUpdatedAt: T0 });
    assert.deepEqual((await call("GET", "/api/users")).body, [res.body]);
    assert.deepEqual((await call("GET", "/api/users/u1")).body, res.body);
  });

  test("POST with an unknown zip saves the user as pending", async () => {
    const res = await call("POST", "/api/users", { name: "Noor", zip: "00000" });
    assert.equal(res.status, 201);
    assert.equal(res.body.city, null);
  });

  test("POST rejects bad input with the design's copy", async () => {
    const cases: [unknown, string, string][] = [
      [{ name: "", zip: "02108" }, "name", "Add a name so people know who this is."],
      [{ name: "Sam", zip: "" }, "zip", "Enter a 5-digit US zip code."],
      [{ name: "Sam", zip: "02-08" }, "zip", "Just the 5 digits, please — no letters or dashes."],
      [{ name: "Sam", zip: "021" }, "zip", "Zip codes are 5 digits — 021 is two short."],
      [{ name: "x".repeat(81), zip: "02108" }, "name", "Keep names under 80 characters."],
    ];
    for (const [input, field, message] of cases) {
      const res = await call("POST", "/api/users", input);
      assert.equal(res.status, 400);
      assert.deepEqual(res.body, { error: { code: "invalid", message, field } });
    }
    assert.equal((await call("POST", "/api/users", "{not json")).status, 400);
    assert.equal((await call("POST", "/api/users", [1])).status, 400);
  });

  test("PATCH only re-runs the lookup when the zip changes", async () => {
    await call("POST", "/api/users", { name: "Lena", zip: "02108" });
    const renamed = await call("PATCH", "/api/users/u1", { name: "Lena Hoffmann", zip: "02108" });
    assert.equal(renamed.body.name, "Lena Hoffmann");
    assert.deepEqual(lookups.calls, ["02108"]);
    const moved = await call("PATCH", "/api/users/u1", { zip: "80202" });
    assert.equal(moved.body.city, "Denver");
    assert.deepEqual(lookups.calls, ["02108", "80202"]);
    assert.equal((await call("PATCH", "/api/users/u1", {})).status, 400);
  });

  test("DELETE removes, then 404s", async () => {
    await call("POST", "/api/users", { name: "Lena", zip: "02108" });
    assert.equal((await call("DELETE", "/api/users/u1")).status, 204);
    assert.equal((await call("DELETE", "/api/users/u1")).status, 404);
    assert.equal((await call("GET", "/api/users/u1")).body.error.code, "user_not_found");
  });

  test("refresh-location reports provider trouble without touching the record", async () => {
    await call("POST", "/api/users", { name: "Noor", zip: "99999" });
    const res = await call("POST", "/api/users/u1/refresh-location");
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, "provider_unavailable");
    lookups.table["99999"] = DENVER;
    assert.equal((await call("POST", "/api/users/u1/refresh-location")).body.city, "Denver");
  });

  test("GET /api/zip/:zip previews a lookup", async () => {
    assert.deepEqual((await call("GET", "/api/zip/02108")).body, { zip: "02108", ...BOSTON });
    const missing = await call("GET", "/api/zip/00000");
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.message, "We could not find 00000. Double-check it, or save anyway and we will retry.");
    assert.equal((await call("GET", "/api/zip/99999")).status, 503);
    assert.equal((await call("GET", "/api/zip/12ab5")).status, 400);
  });

  test("unknown api paths are json 404s", async () => {
    assert.equal((await call("GET", "/api/nope")).body.error.code, "not_found");
  });
});
