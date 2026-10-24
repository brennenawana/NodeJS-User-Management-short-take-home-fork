import { existsSync } from "node:fs";
import { appFromEnv } from "./compose.js";
import { product } from "./product.js";

const envFile = new URL("../../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { app, config } = appFromEnv(process.env);

app.listen(config.port, () => {
  console.log(`${product.name} API on http://localhost:${config.port} (location: ${config.locationProvider}, storage: ${config.storage})`);
});
