import type { LocationProvider } from "../../core/ports.js";
import * as fixture from "./fixture/index.js";
import * as google from "./google/index.js";
import * as openweathermap from "./openweathermap/index.js";

// Each provider folder exports fromEnv. Adding one is a folder plus a line here.
export const locationProviders = {
  fixture,
  openweathermap,
  google,
} satisfies Record<string, { fromEnv(env: NodeJS.ProcessEnv): LocationProvider }>;

export type LocationProviderName = keyof typeof locationProviders;
