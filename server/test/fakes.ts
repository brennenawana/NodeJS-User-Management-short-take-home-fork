import { ProviderUnavailable, ZipNotFound } from "../src/core/errors.js";
import type { Clock, LocationProvider, UsersRepo, ZipDirectory } from "../src/core/ports.js";
import type { Location, User } from "../src/core/user.js";

export const BOSTON: Location = { city: "Boston", lat: 42.3576, lon: -71.0684, utcOffsetSeconds: -14400 };
export const DENVER: Location = { city: "Denver", lat: 39.7491, lon: -104.9946, utcOffsetSeconds: -21600 };

/** A provider driven by a table. Zips mapped to "down" throw ProviderUnavailable. */
export function fakeProvider(table: Record<string, Location | "down">) {
  const calls: string[] = [];
  const provider: LocationProvider = {
    async lookupZip(zip) {
      calls.push(zip);
      const hit = table[zip];
      if (hit === "down") throw new ProviderUnavailable("fake outage");
      if (!hit) throw new ZipNotFound(zip);
      return hit;
    },
  };
  return { provider, calls, table };
}

export function fixedClock(iso: string): Clock & { set(iso: string): void } {
  let now = new Date(iso);
  return { now: () => now, set: (next) => (now = new Date(next)) };
}

export function fakeRepo(): UsersRepo {
  const rows = new Map<string, User>();
  return {
    async list() { return [...rows.values()]; },
    async get(id) { return rows.get(id); },
    async create(user) { rows.set(user.id, user); },
    async update(user) { rows.set(user.id, user); },
    async delete(id) { return rows.delete(id); },
  };
}

export function sequentialIds() {
  let n = 0;
  return () => `u${++n}`;
}

/** A directory of real zips, for tests. */
export function fakeDirectory(zips: string[]): ZipDirectory & { zips: Set<string> } {
  const set = new Set(zips);
  return { zips: set, has: (zip) => set.has(zip) };
}
