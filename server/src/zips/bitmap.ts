import type { ZipDirectory } from "../core/ports.js";

/** Reads a bitmap with one bit per 5-digit zip, as built by scripts/build-zip-directory.mjs. */
export function createBitmapDirectory(base64: string): ZipDirectory {
  const bits = Buffer.from(base64, "base64");
  if (bits.length !== 100_000 / 8) throw new Error(`zip bitmap is ${bits.length} bytes, expected 12500`);
  return {
    has(zip) {
      if (!/^\d{5}$/.test(zip)) return false;
      const n = Number(zip);
      return ((bits[n >> 3] ?? 0) & (1 << (n & 7))) !== 0;
    },
  };
}
