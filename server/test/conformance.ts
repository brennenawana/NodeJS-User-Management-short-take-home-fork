import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ProviderUnavailable, ZipNotFound } from "../src/core/errors.js";
import type { LocationProvider } from "../src/core/ports.js";
import { locationSchema } from "../src/core/user.js";

export interface ConformanceHarness {
  /** A provider that answers normally. Must resolve 02108 to Boston and not know 00000. */
  working: () => LocationProvider;
  /** A provider whose backend is down or unreachable. */
  outage: () => LocationProvider;
  /** A provider whose backend answers with something unexpected. Omit if that can't happen. */
  garbage?: () => LocationProvider;
}

/** Every location provider runs this suite, so core can treat them all the same. */
export function locationProviderConformance(name: string, harness: ConformanceHarness) {
  describe(`${name} location provider conformance`, () => {
    test("resolves a known zip to a valid location", async () => {
      const location = await harness.working().lookupZip("02108");
      assert.deepEqual(locationSchema.parse(location), location, "returns only the Location fields");
      assert.equal(location.city, "Boston");
      assert.ok(Math.abs(location.lat - 42.36) < 0.05 && Math.abs(location.lon + 71.06) < 0.05);
      assert.ok([-14400, -18000].includes(location.utcOffsetSeconds), "Boston is UTC−4 or UTC−5");
    });

    test("throws ZipNotFound for a zip that doesn't exist", async () => {
      await assert.rejects(harness.working().lookupZip("00000"), (e: unknown) => e instanceof ZipNotFound && e.zip === "00000");
    });

    test("throws ProviderUnavailable when the backend is down", async () => {
      await assert.rejects(harness.outage().lookupZip("02108"), ProviderUnavailable);
    });

    test("throws ProviderUnavailable when the backend answers with garbage", { skip: !harness.garbage }, async () => {
      await assert.rejects(harness.garbage!().lookupZip("02108"), ProviderUnavailable);
    });
  });
}
