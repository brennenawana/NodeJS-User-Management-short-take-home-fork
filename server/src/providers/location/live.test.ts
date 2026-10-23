import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ZipNotFound } from "../../core/errors.js";
import { locationProviders } from "./index.js";

// Hits the real services. Opt in with LIVE=1 and the provider's key in the environment.
const live = process.env.LIVE === "1";
const keys = { openweathermap: "OPENWEATHER_API_KEY", google: "GOOGLE_MAPS_API_KEY" } as const;

for (const [name, key] of Object.entries(keys) as [keyof typeof keys, string][]) {
  describe(`${name} live`, { skip: !live || !process.env[key] }, () => {
    const provider = () => locationProviders[name].fromEnv(process.env);
    test("resolves 02108 to Boston", async () => {
      assert.equal((await provider().lookupZip("02108")).city, "Boston");
    });
    test("doesn't know 00000", async () => {
      await assert.rejects(provider().lookupZip("00000"), ZipNotFound);
    });
  });
}
