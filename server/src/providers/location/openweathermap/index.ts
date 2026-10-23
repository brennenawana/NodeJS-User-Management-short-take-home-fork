import { z } from "zod";
import { ProviderUnavailable, ZipNotFound } from "../../../core/errors.js";
import type { LocationProvider } from "../../../core/ports.js";
import { locationSchema } from "../../../core/user.js";
import { getJson, type Fetch } from "../http.js";

// Only the fields we use from https://openweathermap.org/current
const currentWeather = z.object({
  name: z.string().min(1),
  coord: z.object({ lat: z.number(), lon: z.number() }),
  timezone: z.number().int(),
});

export interface OpenWeatherMapOptions {
  apiKey: string;
  fetch?: Fetch;
  baseUrl?: string;
  timeoutMs?: number;
}

export function createOpenWeatherMapProvider({
  apiKey,
  fetch = globalThis.fetch,
  baseUrl = "https://api.openweathermap.org/data/2.5/weather",
  timeoutMs = 5000,
}: OpenWeatherMapOptions): LocationProvider {
  return {
    async lookupZip(zip) {
      const url = new URL(baseUrl);
      url.searchParams.set("zip", `${zip},us`);
      url.searchParams.set("appid", apiKey);
      const { status, body } = await getJson(fetch, url, "OpenWeatherMap", timeoutMs);
      if (status === 404) throw new ZipNotFound(zip);
      if (status !== 200) throw new ProviderUnavailable(`OpenWeatherMap answered ${status}`);
      const parsed = currentWeather.safeParse(body);
      if (!parsed.success) throw new ProviderUnavailable("OpenWeatherMap answered with an unexpected shape", { cause: parsed.error });
      const { name, coord, timezone } = parsed.data;
      const location = locationSchema.safeParse({ city: name, lat: coord.lat, lon: coord.lon, utcOffsetSeconds: timezone });
      if (!location.success) throw new ProviderUnavailable("OpenWeatherMap answered with an out of range location", { cause: location.error });
      return location.data;
    },
  };
}

export function fromEnv(env: NodeJS.ProcessEnv): LocationProvider {
  const apiKey = env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("LOCATION_PROVIDER=openweathermap needs OPENWEATHER_API_KEY (see .env.example)");
  return createOpenWeatherMapProvider({ apiKey });
}
