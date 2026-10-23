import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createUsersService } from "./users-service.js";
import { ProviderUnavailable, UserNotFound, ZipNotFound } from "./errors.js";
import { BOSTON, DENVER, fakeProvider, fakeRepo, fixedClock, sequentialIds } from "./fakes.js";

const T0 = "2026-10-19T16:50:00.000Z";
const T1 = "2026-10-23T09:00:00.000Z";

describe("users service", () => {
  let lookups: ReturnType<typeof fakeProvider>;
  let clock: ReturnType<typeof fixedClock>;
  let service: ReturnType<typeof createUsersService>;

  beforeEach(() => {
    lookups = fakeProvider({ "02108": BOSTON, "80202": DENVER, "99999": "down" });
    clock = fixedClock(T0);
    service = createUsersService({ repo: fakeRepo(), locationProvider: lookups.provider, clock, newId: sequentialIds() });
  });

  test("create looks up the zip and stores the location with its timestamp", async () => {
    const user = await service.create({ name: "Lena Hoffmann", zip: "02108" });
    assert.deepEqual(user, { id: "u1", name: "Lena Hoffmann", zip: "02108", ...BOSTON, locationUpdatedAt: T0 });
    assert.deepEqual(await service.get("u1"), user);
  });

  test("create trims the name", async () => {
    const user = await service.create({ name: "  Lena  ", zip: "02108" });
    assert.equal(user.name, "Lena");
  });

  test("create still saves when the zip is unknown, with the location pending", async () => {
    const user = await service.create({ name: "Noor Haddad", zip: "00000" });
    assert.equal(user.city, null);
    assert.equal(user.utcOffsetSeconds, null);
    assert.equal(user.locationUpdatedAt, null);
    assert.equal((await service.list()).length, 1);
  });

  test("create still saves when the provider is down", async () => {
    const user = await service.create({ name: "Noor Haddad", zip: "99999" });
    assert.equal(user.city, null);
  });

  test("a patch that keeps the zip does not look it up again", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    clock.set(T1);
    const updated = await service.update(created.id, { name: "Lena Hoffmann", zip: "02108" });
    assert.deepEqual(lookups.calls, ["02108"]);
    assert.equal(updated.name, "Lena Hoffmann");
    assert.equal(updated.locationUpdatedAt, T0);
  });

  test("a patch with a new zip looks it up and replaces the location", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    clock.set(T1);
    const updated = await service.update(created.id, { zip: "80202" });
    assert.deepEqual(lookups.calls, ["02108", "80202"]);
    assert.deepEqual(updated, { id: created.id, name: "Lena", zip: "80202", ...DENVER, locationUpdatedAt: T1 });
  });

  test("a new zip that can't be found leaves the location pending, not stale", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    const updated = await service.update(created.id, { zip: "00000" });
    assert.equal(updated.zip, "00000");
    assert.equal(updated.city, null);
  });

  test("refresh re-runs the lookup for the current zip", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    lookups.table["02108"] = { ...BOSTON, utcOffsetSeconds: -18000 };
    clock.set(T1);
    const refreshed = await service.refreshLocation(created.id);
    assert.equal(refreshed.utcOffsetSeconds, -18000);
    assert.equal(refreshed.locationUpdatedAt, T1);
  });

  test("refresh fills in a pending location once the zip resolves", async () => {
    const created = await service.create({ name: "Noor", zip: "99999" });
    lookups.table["99999"] = DENVER;
    const refreshed = await service.refreshLocation(created.id);
    assert.equal(refreshed.city, "Denver");
  });

  test("a failed refresh reports why and keeps the record as it was", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    lookups.table["02108"] = "down";
    await assert.rejects(service.refreshLocation(created.id), ProviderUnavailable);
    assert.deepEqual(await service.get(created.id), created);
  });

  test("lookupZip passes provider errors through", async () => {
    assert.deepEqual(await service.lookupZip("02108"), BOSTON);
    await assert.rejects(service.lookupZip("00000"), ZipNotFound);
    await assert.rejects(service.lookupZip("99999"), ProviderUnavailable);
  });

  test("list is sorted by name", async () => {
    await service.create({ name: "Sam", zip: "02108" });
    await service.create({ name: "maya", zip: "02108" });
    await service.create({ name: "Grace", zip: "02108" });
    assert.deepEqual((await service.list()).map((u) => u.name), ["Grace", "maya", "Sam"]);
  });

  test("remove deletes, and missing ids raise UserNotFound", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    await service.remove(created.id);
    assert.equal(await service.get(created.id), undefined);
    await assert.rejects(service.remove(created.id), UserNotFound);
    await assert.rejects(service.update("nope", { name: "x" }), UserNotFound);
    await assert.rejects(service.refreshLocation("nope"), UserNotFound);
  });
});
