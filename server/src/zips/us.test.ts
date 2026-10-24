import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadUsZips } from "./us.js";
import { createBitmapDirectory } from "./bitmap.js";

const zips = loadUsZips();

test("knows the sample team's zips and a few edge cases", () => {
  for (const zip of ["02108", "10001", "94103", "60601", "98101", "80202", "33131", "78701", "00501", "99950", "96813"]) {
    assert.ok(zips.has(zip), zip);
  }
});

test("rejects zips that don't exist and anything not 5 digits", () => {
  for (const zip of ["00000", "00001", "11111", "99999", "0210", "021088", "02-08", ""]) assert.equal(zips.has(zip), false, zip);
});

test("the bitmap holds as many zips as the file says", () => {
  const { count, bitmap } = JSON.parse(readFileSync(new URL("../../../zips/us.json", import.meta.url), "utf8"));
  let set = 0;
  for (const byte of Buffer.from(bitmap, "base64")) for (let b = byte; b; b &= b - 1) set++;
  assert.equal(set, count);
  assert.ok(count > 40_000, `${count} zips`);
});

test("refuses a bitmap of the wrong size", () => {
  assert.throws(() => createBitmapDirectory("AAAA"), /12500/);
});
