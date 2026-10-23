export type ZipInput = { kind: "idle" | "bad" | "short"; text: string } | { kind: "complete"; zip: string };

/** Checks what someone has typed so far, before any lookup. Copy comes from the design. */
export function checkZipInput(raw: string): ZipInput {
  const zip = raw.trim();
  if (!zip) return { kind: "idle", text: "Enter a 5-digit US zip code." };
  if (/[^0-9]/.test(zip)) return { kind: "bad", text: "Just the 5 digits, please — no letters or dashes." };
  if (zip.length < 5) {
    const short = ["", "one", "two", "three", "four"][5 - zip.length];
    return { kind: "short", text: `Zip codes are 5 digits — ${zip} is ${short} short.` };
  }
  return { kind: "complete", zip: zip.slice(0, 5) };
}

export const lookupCopy = {
  pending: (zip: string) => `Looking up ${zip}…`,
  unknown: (zip: string) => `We could not find ${zip}. Double-check it, or save anyway and we will retry.`,
  failed: (zip: string) => `We could not look up ${zip} right now. You can still save and we will retry.`,
};
