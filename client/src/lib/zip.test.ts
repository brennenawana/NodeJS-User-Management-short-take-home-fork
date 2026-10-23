import { expect, test } from "vitest";
import { checkZipInput } from "./zip";

test("zip input copy follows the design", () => {
  expect(checkZipInput("")).toEqual({ kind: "idle", text: "Enter a 5-digit US zip code." });
  expect(checkZipInput("02-0")).toEqual({ kind: "bad", text: "Just the 5 digits, please — no letters or dashes." });
  expect(checkZipInput("021")).toEqual({ kind: "short", text: "Zip codes are 5 digits — 021 is two short." });
  expect(checkZipInput("0210")).toEqual({ kind: "short", text: "Zip codes are 5 digits — 0210 is one short." });
  expect(checkZipInput("02108")).toEqual({ kind: "complete", zip: "02108" });
});
