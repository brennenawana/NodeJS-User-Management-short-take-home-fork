import { MAX_NAME_LENGTH } from "../core/user.js";

// Field rules for request bodies, with the copy the design uses for each
// problem. Returns undefined when the value is fine.

export function zipProblem(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return "Enter a 5-digit US zip code.";
  const zip = value.trim();
  if (/[^0-9]/.test(zip)) return "Just the 5 digits, please — no letters or dashes.";
  if (zip.length < 5) {
    const short = ["", "one", "two", "three", "four"][5 - zip.length];
    return `Zip codes are 5 digits — ${zip} is ${short} short.`;
  }
  if (zip.length > 5) return "Zip codes are 5 digits.";
  return undefined;
}

export function nameProblem(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return "Add a name so people know who this is.";
  if (value.trim().length > MAX_NAME_LENGTH) return `Keep names under ${MAX_NAME_LENGTH} characters.`;
  return undefined;
}
