import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createGoogleProvider, fromEnv } from "./index.js";
import { locationProviderConformance } from "../../../../test/conformance.js";
import { recorded, respond, stubFetch, unreachable } from "../../../../test/recorded.js";
import { ProviderUnavailable } from "../../../core/errors.js";

// Hand-written responses in the documented formats (see server/test/fixtures/google/README.md).
const documentedApi = () => stubFetch((url) => {
  if (url.pathname.endsWith("/timezone/json")) return respond(recorded("google/timezone-boston-edt.json"));
  const zip = url.searchParams.get("components")?.match(/postal_code:(\d+)/)?.[1];
  return respond(recorded(zip === "02108" ? "google/geocode-02108.json" : "google/geocode-zero-results.json"));
});

const NOW = new Date("2026-10-19T16:50:00Z");
const provider = (fetch = documentedApi().fetch) => createGoogleProvider({ apiKey: "test-key", fetch, now: () => NOW });

locationProviderConformance("google", {
  working: () => provider(),
  outage: () => provider(unreachable),
  garbage: () => provider(stubFetch(() => respond({ status: 200, body: { status: "OK", results: [{}] } })).fetch),
});

describe("google adapter", () => {
  test("geocodes the zip, then asks for the offset at that point and time", async () => {
    const api = documentedApi();
    const location = await provider(api.fetch).lookupZip("02108");
    assert.deepEqual(location, { city: "Boston", lat: 42.3576, lon: -71.0684, utcOffsetSeconds: -14400 });
    const [geo, tz] = api.urls;
    assert.equal(geo?.searchParams.get("components"), "postal_code:02108|country:US");
    assert.equal(tz?.searchParams.get("location"), "42.3576,-71.0684");
    assert.equal(tz?.searchParams.get("timestamp"), String(NOW.getTime() / 1000));
    assert.equal(tz?.searchParams.get("key"), "test-key");
  });

  test("REQUEST_DENIED is ProviderUnavailable", async () => {
    const fetch = stubFetch(() => respond(recorded("google/geocode-request-denied.json"))).fetch;
    await assert.rejects(provider(fetch).lookupZip("02108"), ProviderUnavailable);
  });

  test("a failed timezone call is ProviderUnavailable", async () => {
    const fetch = stubFetch((url) =>
      url.pathname.endsWith("/timezone/json")
        ? respond({ status: 200, body: { status: "OVER_QUERY_LIMIT" } })
        : respond(recorded("google/geocode-02108.json"))).fetch;
    await assert.rejects(provider(fetch).lookupZip("02108"), ProviderUnavailable);
  });

  test("fromEnv needs a key", () => {
    assert.throws(() => fromEnv({}), /GOOGLE_MAPS_API_KEY/);
  });
});
