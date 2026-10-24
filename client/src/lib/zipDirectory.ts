import us from "../../../zips/us.json";

// The same GeoNames bitmap the server checks (zips/us.json, 12.5 KB), so the form
// can reject a zip that doesn't exist without asking the API.
const bits = Uint8Array.from(atob(us.bitmap), (c) => c.charCodeAt(0));

export function isRealZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false;
  const n = Number(zip);
  return ((bits[n >> 3] ?? 0) & (1 << (n & 7))) !== 0;
}
