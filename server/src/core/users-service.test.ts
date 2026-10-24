import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createUsersService } from "./users-service.js";
import { InvalidZip, ProviderUnavailable, UserNotFound, ZipNotFound } from "./errors.js";
import { BOSTON, DENVER, fakeDirectory, fakeProvider, fakeRepo, fixedClock, sequentialIds } from "./fakes.js";

const T0 = "2026-10-19T16:50:00.000Z";
const T1 = "2026-10-23T09:00:00.000Z";

// 12345 is a real zip whose lookup hits an outage; 00501 is real but the provider
// can't place it; 99999 isn't a US zip at all.
const REAL = ["02108", "80202", "12345", "00501"];

describe("users service", () => {
  let lookups: ReturnType<typeof fakeProvider>;
  let directory: ReturnType<typeof fakeDirectory>;
  let clock: ReturnType<typeof fixedClock>;
  let service: ReturnType<typeof createUsersService>;

  beforeEach(() => {
    lookups = fakeProvider({ "02108": BOSTON, "80202": DENVER, "12345": "down" });
    directory = fakeDirectory(REAL);
    clock = fixedClock(T0);
    service = createUsersService({ repo: fakeRepo(), locationProvider: lookups.provider, zipDirectory: directory, clock, newId: sequentialIds() });
  });

  test("create looks up the zip and stores the location with its timestamp", async () => {
    const user = await service.create({ name: "Lena Hoffmann", zip: "02108" });
    assert.deepEqual(user, { id: "u1", name: "Lena Hoffmann", zip: "02108", ...BOSTON, locationUpdatedAt: T0, locationStatus: "located" });
    assert.deepEqual(await service.get("u1"), user);
  });

  test("create trims the name", async () => {
    const user = await service.create({ name: "  Lena  ", zip: "02108" });
    assert.equal(user.name, "Lena");
  });

  test("create refuses a zip that isn't a real US zip, without calling the provider", async () => {
    await assert.rejects(service.create({ name: "Noor", zip: "99999" }), (e: unknown) => e instanceof InvalidZip && e.zip === "99999");
    assert.deepEqual(lookups.calls, []);
    assert.equal((await service.list()).length, 0);
  });

  test("a real zip the provider can't place is saved and flagged", async () => {
    const user = await service.create({ name: "Noor Haddad", zip: "00501" });
    assert.equal(user.locationStatus, "cantLocate");
    assert.equal(user.city, null);
  });

  test("a provider outage saves the user as pending, to retry later", async () => {
    const user = await service.create({ name: "Noor Haddad", zip: "12345" });
    assert.equal(user.locationStatus, "pending");
    assert.equal(user.utcOffsetSeconds, null);
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
    assert.deepEqual(updated, { id: created.id, name: "Lena", zip: "80202", ...DENVER, locationUpdatedAt: T1, locationStatus: "located" });
  });

  test("a patch to an invalid zip is refused and the record is untouched", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    await assert.rejects(service.update(created.id, { zip: "99999" }), InvalidZip);
    assert.deepEqual(await service.get(created.id), created);
  });

  test("a patch to a zip the provider can't place flags the user instead of keeping a stale location", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    const updated = await service.update(created.id, { zip: "00501" });
    assert.equal(updated.zip, "00501");
    assert.equal(updated.locationStatus, "cantLocate");
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

  test("refresh fills in a pending location once the provider is back", async () => {
    const created = await service.create({ name: "Noor", zip: "12345" });
    lookups.table["12345"] = DENVER;
    const refreshed = await service.refreshLocation(created.id);
    assert.equal(refreshed.locationStatus, "located");
    assert.equal(refreshed.city, "Denver");
  });

  test("refresh flags a zip that is no longer a real zip", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    directory.zips.delete("02108");
    const refreshed = await service.refreshLocation(created.id);
    assert.equal(refreshed.locationStatus, "invalidZip");
    assert.equal(refreshed.city, null);
    assert.deepEqual(lookups.calls, ["02108"], "no lookup for a zip we know is gone");
    assert.deepEqual(await service.get(created.id), refreshed);
  });

  test("refresh flags a zip the provider can no longer place", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    delete lookups.table["02108"];
    const refreshed = await service.refreshLocation(created.id);
    assert.equal(refreshed.locationStatus, "cantLocate");
  });

  test("a refresh during an outage reports it and keeps the record as it was", async () => {
    const created = await service.create({ name: "Lena", zip: "02108" });
    lookups.table["02108"] = "down";
    await assert.rejects(service.refreshLocation(created.id), ProviderUnavailable);
    assert.deepEqual(await service.get(created.id), created);
  });

  test("lookupZip refuses invalid zips and passes provider errors through", async () => {
    assert.deepEqual(await service.lookupZip("02108"), BOSTON);
    await assert.rejects(service.lookupZip("99999"), InvalidZip);
    await assert.rejects(service.lookupZip("00501"), ZipNotFound);
    await assert.rejects(service.lookupZip("12345"), ProviderUnavailable);
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
