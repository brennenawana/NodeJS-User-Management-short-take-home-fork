import { z } from "zod";
import { locationProviders, type LocationProviderName } from "./providers/location/index.js";
import { storages, type StorageName } from "./storage/index.js";

const names = <T extends string>(o: Record<T, unknown>) => Object.keys(o) as [T, ...T[]];

const configSchema = z.object({
  API_PORT: z.coerce.number().int().min(0).max(65535).default(8080),
  LOCATION_PROVIDER: z.enum(names(locationProviders)).default("fixture"),
  STORAGE: z.enum(names(storages)).default("json-file"),
});

export interface Config {
  port: number;
  locationProvider: LocationProviderName;
  storage: StorageName;
}

/** Parses the environment once at startup. Provider and storage specifics are read by their own fromEnv. */
export function loadConfig(env: NodeJS.ProcessEnv): Config {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid configuration. ${problems}`);
  }
  const { API_PORT, LOCATION_PROVIDER, STORAGE } = parsed.data;
  return { port: API_PORT, locationProvider: LOCATION_PROVIDER, storage: STORAGE };
}
