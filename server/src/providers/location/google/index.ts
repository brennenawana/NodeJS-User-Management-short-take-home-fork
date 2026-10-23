import { z } from "zod";
import { ProviderUnavailable, ZipNotFound } from "../../../core/errors.js";
import type { LocationProvider } from "../../../core/ports.js";
import { locationSchema } from "../../../core/user.js";
import { getJson, type Fetch } from "../http.js";

// Only the fields we use from the Geocoding API and the Time Zone API.
const geocode = z.object({
  status: z.string(),
  results: z.array(z.object({
    address_components: z.array(z.object({ long_name: z.string(), types: z.array(z.string()) })),
    geometry: z.object({ location: z.object({ lat: z.number(), lng: z.number() }) }),
  })),
});

const timezone = z.object({
  status: z.string(),
  rawOffset: z.number().optional(),
  dstOffset: z.number().optional(),
});

// Address component types that name a city, most specific first.
const CITY_TYPES = ["locality", "postal_town", "sublocality", "neighborhood", "administrative_area_level_3"];

export interface GoogleOptions {
  apiKey: string;
  fetch?: Fetch;
  now?: () => Date;
  baseUrl?: string;
  timeoutMs?: number;
}

export function createGoogleProvider({
  apiKey,
  fetch = globalThis.fetch,
  now = () => new Date(),
  baseUrl = "https://maps.googleapis.com/maps/api",
  timeoutMs = 5000,
}: GoogleOptions): LocationProvider {
  async function call<T>(path: string, params: Record<string, string>, schema: z.ZodType<T>): Promise<T> {
    const url = new URL(`${baseUrl}/${path}/json`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    url.searchParams.set("key", apiKey);
    const { status, body } = await getJson(fetch, url, "Google", timeoutMs);
    if (status !== 200) throw new ProviderUnavailable(`Google ${path} answered ${status}`);
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new ProviderUnavailable(`Google ${path} answered with an unexpected shape`, { cause: parsed.error });
    return parsed.data;
  }

  return {
    async lookupZip(zip) {
      const geo = await call("geocode", { components: `postal_code:${zip}|country:US` }, geocode);
      if (geo.status === "ZERO_RESULTS") throw new ZipNotFound(zip);
      const hit = geo.results[0];
      if (geo.status !== "OK" || !hit) throw new ProviderUnavailable(`Google geocode status ${geo.status}`);
      const city = CITY_TYPES.map((type) => hit.address_components.find((c) => c.types.includes(type))).find(Boolean)?.long_name;
      const { lat, lng } = hit.geometry.location;

      // The offset depends on the date (DST), so ask for "now", matching what OpenWeatherMap reports.
      const timestamp = String(Math.floor(now().getTime() / 1000));
      const tz = await call("timezone", { location: `${lat},${lng}`, timestamp }, timezone);
      if (tz.status !== "OK" || tz.rawOffset === undefined || tz.dstOffset === undefined) {
        throw new ProviderUnavailable(`Google timezone status ${tz.status}`);
      }

      const location = locationSchema.safeParse({ city, lat, lon: lng, utcOffsetSeconds: tz.rawOffset + tz.dstOffset });
      if (!location.success) throw new ProviderUnavailable("Google answered with an incomplete location", { cause: location.error });
      return location.data;
    },
  };
}

export function fromEnv(env: NodeJS.ProcessEnv): LocationProvider {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("LOCATION_PROVIDER=google needs GOOGLE_MAPS_API_KEY (see .env.example)");
  return createGoogleProvider({ apiKey });
}
