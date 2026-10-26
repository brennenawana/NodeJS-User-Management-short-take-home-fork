import { readFileSync } from "node:fs";
import type { Fetch } from "../src/providers/location/http.js";

export const fixturesDir = new URL("fixtures/", import.meta.url);

/** Reads a saved `{ status, body }` response from the repo's fixtures folder. */
export function recorded(path: string): { status: number; body: unknown } {
  return JSON.parse(readFileSync(new URL(path, fixturesDir), "utf8"));
}


export function respond({ status, body }: { status: number; body: unknown }) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** A fetch that answers from a function and remembers every URL it was asked for. */
export function stubFetch(answer: (url: URL) => Response | Promise<Response>) {
  const urls: URL[] = [];
  const fetch: Fetch = async (input) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    urls.push(url);
    return answer(url);
  };
  return { fetch, urls };
}

export const unreachable: Fetch = async () => {
  throw new TypeError("fetch failed");
};
