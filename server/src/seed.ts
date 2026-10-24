import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { systemClock } from "./app.js";
import { createUsersService } from "./core/users-service.js";
import { loadConfig } from "./config.js";
import { locationProviders } from "./providers/location/index.js";
import { storages } from "./storage/index.js";
import { loadUsZips } from "./zips/us.js";

// Adds the sample team through the normal service path.
const envFile = new URL("../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const SAMPLE = [
  ["Maya Okafor", "10001"], ["Daniel Reyes", "94103"], ["Priya Raman", "60601"], ["Tomás Lindqvist", "98101"],
  ["Grace Whitfield", "80202"], ["Jonah Abernathy", "33131"], ["Lena Hoffmann", "02108"], ["Sam Castillo", "78701"],
] as const;

const config = loadConfig(process.env);
const service = createUsersService({
  repo: storages[config.storage](process.env),
  locationProvider: locationProviders[config.locationProvider].fromEnv(process.env),
  zipDirectory: loadUsZips(),
  clock: systemClock,
  newId: randomUUID,
});

const existing = new Set((await service.list()).map((u) => u.name));
for (const [name, zip] of SAMPLE) {
  if (existing.has(name)) continue;
  const user = await service.create({ name, zip });
  console.log(`added ${user.name} (${user.city ?? "location pending"})`);
}
