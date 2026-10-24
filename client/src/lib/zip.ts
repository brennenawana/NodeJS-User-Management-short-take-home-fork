import { isRealZip } from "./zipDirectory";

export type ZipInput = { kind: "idle" | "bad" | "short" | "notReal"; text: string } | { kind: "complete"; zip: string };

/** Checks what someone has typed so far, before any lookup: format first, then the US zip list. */
export function checkZipInput(raw: string): ZipInput {
  const zip = raw.trim();
  if (!zip) return { kind: "idle", text: "Enter a 5-digit US zip code." };
  if (/[^0-9]/.test(zip)) return { kind: "bad", text: "Just the 5 digits, please — no letters or dashes." };
  if (zip.length < 5) {
    const short = ["", "one", "two", "three", "four"][5 - zip.length];
    return { kind: "short", text: `Zip codes are 5 digits — ${zip} is ${short} short.` };
  }
  if (!isRealZip(zip)) return { kind: "notReal", text: notRealCopy(zip) };
  return { kind: "complete", zip };
}

export const notRealCopy = (zip: string) => `We couldn't find ${zip}. Check the zip and try again.`;

export const lookupCopy = {
  pending: (zip: string) => `Looking up ${zip}…`,
  /** A real zip the location provider can't place. */
  unknown: (zip: string) => `We can't place ${zip} on the map. You can still save; their card will be flagged.`,
  failed: (zip: string) => `We could not look up ${zip} right now. You can still save and we will retry.`,
};
