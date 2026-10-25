import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { buildApp } from "../app.js";
import { createMemoryRepo } from "../storage/memory/index.js";
import { BOSTON, DENVER, fakeDirectory, fakeProvider, fixedClock, sequentialIds } from "../core/fakes.js";

const T0 = "2026-10-19T16:50:00.000Z";

describe("http api", () => {
  let server: Server;
  let base: string;
  let lookups: ReturnType<typeof fakeProvider>;
  let clock: ReturnType<typeof fixedClock>;
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
    // 12345 is real but hits an outage, 00501 is real but can't be placed, 99999 isn't a zip.
    lookups = fakeProvider({ "02108": BOSTON, "80202": DENVER, "12345": "down" });
    clock = fixedClock(T0);
    app = buildApp({
      repo: createMemoryRepo(), locationProvider: lookups.provider, zipDirectory: fakeDirectory(["02108", "80202", "12345", "00501"]),
      clock, newId: sequentialIds(),
    });
  });

  test("POST creates a located user", async () => {
    const res = await call("POST", "/api/users", { name: "Lena Hoffmann", zip: "02108" });
    assert.equal(res.status, 201);
    assert.deepEqual(res.body, { id: "u1", name: "Lena Hoffmann", zip: "02108", ...BOSTON, locationUpdatedAt: T0, locationStatus: "located" });
    assert.deepEqual((await call("GET", "/api/users")).body, [res.body]);
    assert.deepEqual((await call("GET", "/api/users/u1")).body, res.body);
  });

  test("POST refuses a zip that isn't real", async () => {
    const res = await call("POST", "/api/users", { name: "Noor", zip: "99999" });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, { error: { code: "invalid_zip", message: "We couldn't find 99999. Check the zip and try again.", field: "zip" } });
    assert.deepEqual((await call("GET", "/api/users")).body, []);
  });

  test("POST saves and flags a real zip the provider can't place, or saves as pending in an outage", async () => {
    assert.equal((await call("POST", "/api/users", { name: "Noor", zip: "00501" })).body.locationStatus, "cantLocate");
    assert.equal((await call("POST", "/api/users", { name: "Sam", zip: "12345" })).body.locationStatus, "pending");
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
    const invalid = await call("PATCH", "/api/users/u1", { zip: "99999" });
    assert.equal(invalid.body.error.code, "invalid_zip");
    assert.equal((await call("GET", "/api/users/u1")).body.city, "Denver");
  });

  test("GET /api/users re-checks an offset looked up more than a day ago", async () => {
    await call("POST", "/api/users", { name: "Lena", zip: "02108" });
    lookups.table["02108"] = { ...BOSTON, utcOffsetSeconds: -18000 };
    clock.set("2026-10-20T17:00:00.000Z");
    const [lena] = (await call("GET", "/api/users")).body;
    assert.equal(lena.utcOffsetSeconds, -18000);
    assert.equal(lena.locationUpdatedAt, "2026-10-20T17:00:00.000Z");
  });

  test("DELETE removes, then 404s", async () => {
    await call("POST", "/api/users", { name: "Lena", zip: "02108" });
    assert.equal((await call("DELETE", "/api/users/u1")).status, 204);
    assert.equal((await call("DELETE", "/api/users/u1")).status, 404);
    assert.equal((await call("GET", "/api/users/u1")).body.error.code, "user_not_found");
  });

  test("refresh-location reports provider trouble without touching the record", async () => {
    await call("POST", "/api/users", { name: "Noor", zip: "12345" });
    const res = await call("POST", "/api/users/u1/refresh-location");
    assert.equal(res.status, 503);
    assert.equal(res.body.error.code, "provider_unavailable");
    lookups.table["12345"] = DENVER;
    assert.equal((await call("POST", "/api/users/u1/refresh-location")).body.city, "Denver");
  });

  test("GET /api/zip/:zip previews a lookup", async () => {
    assert.deepEqual((await call("GET", "/api/zip/02108")).body, { zip: "02108", ...BOSTON });
    const invalid = await call("GET", "/api/zip/99999");
    assert.equal(invalid.status, 400);
    assert.equal(invalid.body.error.code, "invalid_zip");
    const unplaceable = await call("GET", "/api/zip/00501");
    assert.equal(unplaceable.status, 404);
    assert.equal(unplaceable.body.error.message, "We can't place 00501 on the map. You can still save; their card will be flagged.");
    assert.equal((await call("GET", "/api/zip/12345")).status, 503);
    assert.equal((await call("GET", "/api/zip/12ab5")).status, 400);
  });

  test("unknown api paths are json 404s", async () => {
    assert.equal((await call("GET", "/api/nope")).body.error.code, "not_found");
  });
});
