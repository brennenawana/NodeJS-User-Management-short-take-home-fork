import { ProviderUnavailable, ZipNotFound } from "../../../core/errors.js";
import type { LocationProvider } from "../../../core/ports.js";
import type { Location } from "../../../core/user.js";
import { ZIPS } from "./zips.js";

/**
 * A real zip (Schenectady, NY) that simulates an outage, so the "lookup failed" path
 * can be exercised offline. Real zips missing from the table come back as not found.
 */
export const OUTAGE_ZIP = "12345";

/** Offline provider backed by a small table. Used by tests, e2e and anyone without an API key. */
export function createFixtureProvider(table: Record<string, Location> = ZIPS, { down = false } = {}): LocationProvider {
  return {
    async lookupZip(zip) {
      if (down || zip === OUTAGE_ZIP) throw new ProviderUnavailable("fixture outage");
      const hit = table[zip];
      if (!hit) throw new ZipNotFound(zip);
      return { ...hit };
    },
  };
}

export function fromEnv(): LocationProvider {
  return createFixtureProvider();
}
