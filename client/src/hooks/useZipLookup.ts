import { useEffect, useState } from "react";
import { api, ApiError, type ZipPreview } from "../api";
import { checkZipInput } from "../lib/zip";

export type ZipLookup =
  | { status: "idle" }
  | { status: "pending"; zip: string }
  | { status: "found"; zip: string; hit: ZipPreview }
  | { status: "unknown"; zip: string }
  | { status: "failed"; zip: string };

export const LOOKUP_DEBOUNCE_MS = 350;

/** Debounced live lookup for a zip field. Only complete zips are looked up. */
export function useZipLookup(raw: string, enabled = true): ZipLookup {
  const input = checkZipInput(raw);
  const zip = enabled && input.kind === "complete" ? input.zip : null;
  const [result, setResult] = useState<ZipLookup>({ status: "idle" });

  useEffect(() => {
    if (!zip) return;
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const hit = await api.lookupZip(zip);
        if (!stale) setResult({ status: "found", zip, hit });
      } catch (error) {
        if (stale) return;
        const notFound = error instanceof ApiError && error.code === "zip_not_found";
        setResult({ status: notFound ? "unknown" : "failed", zip });
      }
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      stale = true;
    };
  }, [zip]);

  if (!zip) return { status: "idle" };
  if (result.status === "idle" || result.zip !== zip) return { status: "pending", zip };
  return result;
}
