import { readFileSync } from "node:fs";
import { z } from "zod";
import { createBitmapDirectory } from "./bitmap.js";

const file = z.object({ count: z.number().int().positive(), bitmap: z.string() });

/** Every real US zip, from zips/us.json (GeoNames, CC BY 4.0). */
export function loadUsZips() {
  const { bitmap } = file.parse(JSON.parse(readFileSync(new URL("../../../zips/us.json", import.meta.url), "utf8")));
  return createBitmapDirectory(bitmap);
}
