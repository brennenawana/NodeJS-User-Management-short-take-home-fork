// Packs the GeoNames US postal codes into a bitmap: one bit per possible 5-digit
// zip (00000-99999), 12.5 KB in all, base64 in zips/us.json.
//
//   curl -LO https://download.geonames.org/export/zip/US.zip && unzip US.zip US.txt
//   node scripts/build-zip-directory.mjs US.txt
import { readFileSync, writeFileSync } from "node:fs";

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/build-zip-directory.mjs path/to/US.txt");
  process.exit(1);
}

const bits = new Uint8Array(100_000 / 8);
let count = 0;
for (const line of readFileSync(input, "utf8").split("\n")) {
  const [country, zip] = line.split("\t");
  if (country !== "US" || !/^\d{5}$/.test(zip ?? "")) continue;
  const n = Number(zip);
  if (!(bits[n >> 3] & (1 << (n & 7)))) count++;
  bits[n >> 3] |= 1 << (n & 7);
}

const out = {
  source: "GeoNames US postal codes, https://download.geonames.org/export/zip/US.zip",
  license: "CC BY 4.0, https://creativecommons.org/licenses/by/4.0/",
  attribution: "Contains data from GeoNames (www.geonames.org)",
  built: new Date().toISOString().slice(0, 10),
  count,
  bitmap: Buffer.from(bits).toString("base64"),
};
writeFileSync(new URL("../zips/us.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`${count} zips -> zips/us.json (${out.bitmap.length} base64 chars)`);
