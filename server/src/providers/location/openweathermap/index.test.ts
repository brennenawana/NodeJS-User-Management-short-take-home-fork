import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createOpenWeatherMapProvider, fromEnv } from "./index.js";
import { locationProviderConformance } from "../conformance.js";
import { recorded, respond, stubFetch, unreachable } from "../recorded.js";
import { ProviderUnavailable, ZipNotFound } from "../../../core/errors.js";

// Answers from the real responses captured by scripts/probe-openweathermap.mjs.
const recordedApi = stubFetch((url) => {
  const zip = url.searchParams.get("zip")!.split(",")[0];
  try {
    return respond(recorded(`openweathermap/${zip}.json`));
  } catch {
    return respond(recorded("openweathermap/not-found.json"));
  }
});

const provider = (fetch = recordedApi.fetch) => createOpenWeatherMapProvider({ apiKey: "test-key", fetch });

locationProviderConformance("openweathermap", {
  working: () => provider(),
  outage: () => provider(unreachable),
  garbage: () => provider(stubFetch(() => respond({ status: 200, body: { cod: 200, name: "Boston" } })).fetch),
});

describe("openweathermap adapter", () => {
  test("maps name, coord and timezone from a recorded response", async () => {
    assert.deepEqual(await provider().lookupZip("80202"), {
      city: "Denver", lat: 39.7491, lon: -104.9946, utcOffsetSeconds: -21600,
    });
  });

  test("asks for a US zip with the api key", async () => {
    const { fetch, urls } = stubFetch(() => respond(recorded("openweathermap/02108.json")));
    await provider(fetch).lookupZip("02108");
    assert.equal(urls[0]?.searchParams.get("zip"), "02108,us");
    assert.equal(urls[0]?.searchParams.get("appid"), "test-key");
  });

  test("a recorded 404 is ZipNotFound", async () => {
    await assert.rejects(provider().lookupZip("00000"), ZipNotFound);
  });

  for (const status of [401, 429, 500, 502]) {
    test(`a ${status} is ProviderUnavailable and doesn't leak the key`, async () => {
      const fetch = stubFetch(() => respond({ status, body: { cod: status, message: "nope" } })).fetch;
      await assert.rejects(provider(fetch).lookupZip("02108"), (e: unknown) =>
        e instanceof ProviderUnavailable && !e.message.includes("test-key"));
    });
  }

  test("a body that isn't json is ProviderUnavailable", async () => {
    const fetch = stubFetch(() => new Response("<html>bad gateway</html>", { status: 502 })).fetch;
    await assert.rejects(provider(fetch).lookupZip("02108"), ProviderUnavailable);
  });

  test("fromEnv needs a key", () => {
    assert.throws(() => fromEnv({}), /OPENWEATHER_API_KEY/);
  });
});
