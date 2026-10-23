// Calls the OpenWeatherMap current weather API for the sample zips and saves
// the raw responses as fixtures. Run: node scripts/probe-openweathermap.mjs
import { writeFile, mkdir } from "node:fs/promises";

process.loadEnvFile?.(".env");
const key = process.env.OPENWEATHER_API_KEY;
if (!key) {
  console.error("OPENWEATHER_API_KEY is not set (see .env.example)");
  process.exit(1);
}

const zips = ["10001", "94103", "60601", "98101", "80202", "33131", "02108", "78701"];
const badZip = "00000";
const outDir = new URL("../fixtures/openweathermap/", import.meta.url);
await mkdir(outDir, { recursive: true });

async function probe(zip, file) {
  const url = `https://api.openweathermap.org/data/2.5/weather?zip=${zip},us&appid=${key}`;
  const res = await fetch(url);
  const body = await res.json();
  const saved = { status: res.status, body };
  await writeFile(new URL(file, outDir), JSON.stringify(saved, null, 2) + "\n");
  const summary = res.ok
    ? `${body.name} ${body.coord.lat},${body.coord.lon} tz ${body.timezone}`
    : `${res.status} ${body.message}`;
  console.log(zip.padEnd(6), summary);
}

for (const zip of zips) await probe(zip, `${zip}.json`);
await probe(badZip, "not-found.json");
