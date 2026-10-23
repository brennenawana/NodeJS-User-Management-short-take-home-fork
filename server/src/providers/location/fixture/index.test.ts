import { test } from "node:test";
import assert from "node:assert/strict";
import { createFixtureProvider, OUTAGE_ZIP } from "./index.js";
import { locationProviderConformance } from "../conformance.js";
import { ProviderUnavailable } from "../../../core/errors.js";

locationProviderConformance("fixture", {
  working: () => createFixtureProvider(),
  outage: () => createFixtureProvider(undefined, { down: true }),
});

test("fixture simulates an outage for its outage zip", async () => {
  await assert.rejects(createFixtureProvider().lookupZip(OUTAGE_ZIP), ProviderUnavailable);
});
