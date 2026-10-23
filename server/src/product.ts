import { readFileSync } from "node:fs";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export type Product = z.infer<typeof productSchema>;

export const productFile = new URL("../../product.json", import.meta.url);

export const product: Product = productSchema.parse(
  JSON.parse(readFileSync(productFile, "utf8")),
);
