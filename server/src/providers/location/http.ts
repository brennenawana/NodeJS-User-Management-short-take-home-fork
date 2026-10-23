import { ProviderUnavailable } from "../../core/errors.js";

export type Fetch = typeof globalThis.fetch;

/** GETs JSON for a provider, turning network errors and timeouts into ProviderUnavailable. */
export async function getJson(fetch: Fetch, url: URL, provider: string, timeoutMs: number) {
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (cause) {
    throw new ProviderUnavailable(`${provider} could not be reached`, { cause });
  }
  let body: unknown;
  try {
    body = await res.json();
  } catch (cause) {
    throw new ProviderUnavailable(`${provider} answered ${res.status} with a body that isn't JSON`, { cause });
  }
  return { status: res.status, body };
}
