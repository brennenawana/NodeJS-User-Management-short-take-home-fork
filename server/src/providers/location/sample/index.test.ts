import { test } from "node:test";
import assert from "node:assert/strict";
import { createSampleProvider, OUTAGE_ZIP } from "./index.js";
import { locationProviderConformance } from "../conformance.js";
import { ProviderUnavailable } from "../../../core/errors.js";

locationProviderConformance("sample", {
  working: () => createSampleProvider(),
  outage: () => createSampleProvider(undefined, { down: true }),
});

test("sample simulates an outage for its outage zip", async () => {
  await assert.rejects(createSampleProvider().lookupZip(OUTAGE_ZIP), ProviderUnavailable);
});
