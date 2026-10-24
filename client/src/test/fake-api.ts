import { delay, http, HttpResponse } from "msw";
import type { UnlocatedStatus, User, ZipPreview } from "../api";
import { isRealZip } from "../lib/zipDirectory";

// An in-memory stand-in for the API, close enough to server/src/http to drive the UI.
// Tests run it through msw/node (server.ts); Storybook runs it in the browser.

export const ZIPS: Record<string, Omit<ZipPreview, "zip">> = {
  "02108": { city: "Boston", lat: 42.3576, lon: -71.0684, utcOffsetSeconds: -14400 },
  "10001": { city: "New York", lat: 40.7484, lon: -73.9967, utcOffsetSeconds: -14400 },
  "60601": { city: "Chicago", lat: 41.8858, lon: -87.6181, utcOffsetSeconds: -18000 },
  "80202": { city: "Denver", lat: 39.7491, lon: -104.9946, utcOffsetSeconds: -21600 },
  "94103": { city: "San Francisco", lat: 37.7725, lon: -122.4147, utcOffsetSeconds: -25200 },
};
// All real zips, so they pass the zip list: an outage, a lookup that never answers
// (to hold "looking up"), and one the provider can't place.
export const OUTAGE_ZIP = "12345";
export const SLOW_ZIP = "90210";
export const CANT_LOCATE_ZIP = "00501";
export const NOT_A_ZIP = "99999";
export const UPDATED_AT = "2026-10-19T16:50:00.000Z";

let users: User[] = [];
let nextId = 1;
export const calls: { method: string; path: string; body?: unknown }[] = [];

export function located(name: string, zip: keyof typeof ZIPS, id = `id-${nextId++}`): User {
  return { id, name, zip, ...ZIPS[zip]!, locationUpdatedAt: UPDATED_AT, locationStatus: "located" };
}

export function pending(name: string, zip: string, id = `id-${nextId++}`, locationStatus: UnlocatedStatus = "pending"): User {
  return { id, name, zip, city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null, locationStatus };
}

export function seed(list: User[]) {
  users = list.map((u) => ({ ...u }));
}

export const stored = () => users;

const notFound = (zip: string) =>
  HttpResponse.json({ error: { code: "zip_not_found", message: `We can't place ${zip} on the map. You can still save; their card will be flagged.` } }, { status: 404 });
const invalid = (zip: string) =>
  HttpResponse.json({ error: { code: "invalid_zip", message: `We couldn't find ${zip}. Check the zip and try again.`, field: "zip" } }, { status: 400 });
const down = () =>
  HttpResponse.json({ error: { code: "provider_unavailable", message: "We could not look up that zip right now. You can still save and we will retry." } }, { status: 503 });

const unlocated = (locationStatus: UnlocatedStatus) =>
  ({ city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null, locationStatus });

function locate(zip: string) {
  const hit = ZIPS[zip];
  if (zip === OUTAGE_ZIP) return unlocated("pending");
  return hit ? { ...hit, locationUpdatedAt: new Date().toISOString(), locationStatus: "located" as const } : unlocated("cantLocate");
}

export const handlers = [
  http.get("/api/users", () => HttpResponse.json(users)),
  http.post("/api/users", async ({ request }) => {
    const body = (await request.json()) as { name: string; zip: string };
    calls.push({ method: "POST", path: "/api/users", body });
    if (!isRealZip(body.zip)) return invalid(body.zip);
    const user = { id: `id-${nextId++}`, name: body.name, zip: body.zip, ...locate(body.zip) } as User;
    users.push(user);
    return HttpResponse.json(user, { status: 201 });
  }),
  http.patch("/api/users/:id", async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; zip?: string };
    calls.push({ method: "PATCH", path: `/api/users/${params.id}`, body });
    const current = users.find((u) => u.id === params.id);
    if (!current) return HttpResponse.json({ error: { code: "user_not_found", message: "Gone." } }, { status: 404 });
    const zipChanged = body.zip && body.zip !== current.zip;
    if (zipChanged && !isRealZip(body.zip!)) return invalid(body.zip!);
    const user = { ...current, ...body, ...(zipChanged ? locate(body.zip!) : {}) } as User;
    users = users.map((u) => (u.id === user.id ? user : u));
    return HttpResponse.json(user);
  }),
  http.delete("/api/users/:id", ({ params }) => {
    calls.push({ method: "DELETE", path: `/api/users/${params.id}` });
    users = users.filter((u) => u.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
  http.post("/api/users/:id/refresh-location", ({ params }) => {
    calls.push({ method: "POST", path: `/api/users/${params.id}/refresh-location` });
    const current = users.find((u) => u.id === params.id)!;
    if (current.zip === OUTAGE_ZIP) return down();
    const user = { ...current, ...(isRealZip(current.zip) ? locate(current.zip) : unlocated("invalidZip")) } as User;
    users = users.map((u) => (u.id === user.id ? user : u));
    return HttpResponse.json(user);
  }),
  http.get("/api/zip/:zip", async ({ params }) => {
    const zip = params.zip as string;
    await delay(zip === SLOW_ZIP ? "infinite" : 20);
    if (!isRealZip(zip)) return invalid(zip);
    if (zip === OUTAGE_ZIP) return down();
    const hit = ZIPS[zip];
    return hit ? HttpResponse.json({ zip, ...hit }) : notFound(zip);
  }),
];

export function resetApi() {
  users = [];
  nextId = 1;
  calls.length = 0;
}
