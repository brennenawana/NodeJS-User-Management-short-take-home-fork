import { existsSync } from "node:fs";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { product } from "./product.js";
import { locationProviders } from "./providers/location/index.js";
import { storages } from "./storage/index.js";

// The one place concrete implementations are chosen.
const envFile = new URL("../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig(process.env);
const app = buildApp({
  repo: storages[config.storage](process.env),
  locationProvider: locationProviders[config.locationProvider].fromEnv(process.env),
});

app.listen(config.port, () => {
  console.log(`${product.name} API on http://localhost:${config.port} (location: ${config.locationProvider}, storage: ${config.storage})`);
});
