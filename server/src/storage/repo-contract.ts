import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { UsersRepo } from "../core/ports.js";
import type { User } from "../core/user.js";

const lena: User = {
  id: "a", name: "Lena Hoffmann", zip: "02108",
  city: "Boston", lat: 42.3576, lon: -71.0684, utcOffsetSeconds: -14400,
  locationUpdatedAt: "2026-10-19T16:50:00.000Z", locationStatus: "located",
};
const noor: User = {
  id: "b", name: "Noor Haddad", zip: "00000",
  city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null, locationStatus: "pending",
};

/** Every UsersRepo implementation runs this suite. */
export function repoContract(name: string, makeRepo: () => Promise<UsersRepo> | UsersRepo) {
  describe(`${name} repo contract`, () => {
    test("starts empty", async () => {
      assert.deepEqual(await (await makeRepo()).list(), []);
    });

    test("creates, reads, updates and deletes", async () => {
      const repo = await makeRepo();
      await repo.create(lena);
      await repo.create(noor);
      assert.deepEqual(await repo.get("a"), lena);
      assert.equal((await repo.list()).length, 2);

      await repo.update({ ...lena, name: "Lena H." });
      assert.equal((await repo.get("a"))?.name, "Lena H.");

      assert.equal(await repo.delete("a"), true);
      assert.equal(await repo.delete("a"), false);
      assert.equal(await repo.get("a"), undefined);
      assert.deepEqual(await repo.list(), [noor]);
    });

    test("returned records can't be mutated from outside", async () => {
      const repo = await makeRepo();
      await repo.create(lena);
      const copy = await repo.get("a");
      if (copy) copy.name = "changed";
      assert.equal((await repo.get("a"))?.name, "Lena Hoffmann");
    });

    test("concurrent writes all land", async () => {
      const repo = await makeRepo();
      await Promise.all(Array.from({ length: 10 }, (_, i) => repo.create({ ...noor, id: `n${i}` })));
      assert.equal((await repo.list()).length, 10);
    });
  });
}
