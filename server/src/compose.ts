import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { locationProviders } from "./providers/location/index.js";
import { storages } from "./storage/index.js";
import { loadUsZips } from "./zips/us.js";

/** The one place concrete implementations are chosen, for the local server and the Vercel function alike. */
export function appFromEnv(env: NodeJS.ProcessEnv) {
  const config = loadConfig(env);
  const app = buildApp({
    repo: storages[config.storage](env),
    locationProvider: locationProviders[config.locationProvider].fromEnv(env),
    zipDirectory: loadUsZips(),
  });
  return { app, config };
}
