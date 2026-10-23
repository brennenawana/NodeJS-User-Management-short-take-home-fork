// The client's view of the API. Shapes mirror server/src/core/user.ts.

export interface Located {
  city: string;
  lat: number;
  lon: number;
  utcOffsetSeconds: number;
  locationUpdatedAt: string;
}

export interface Pending {
  city: null;
  lat: null;
  lon: null;
  utcOffsetSeconds: null;
  locationUpdatedAt: null;
}

export type User = { id: string; name: string; zip: string } & (Located | Pending);

export interface ZipPreview {
  zip: string;
  city: string;
  lat: number;
  lon: number;
  utcOffsetSeconds: number;
}

export function isLocated(user: User): user is User & Located {
  return user.utcOffsetSeconds !== null;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string, readonly field?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(method: string, path: string, body?: unknown, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(new URL(`/api${path}`, window.location.origin), {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
  } catch {
    throw new ApiError(0, "offline", "We can't reach the server right now. Check your connection and try again.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    const e = data?.error ?? {};
    throw new ApiError(res.status, e.code ?? "unknown", e.message ?? "Something went wrong.", e.field);
  }
  return data as T;
}

export const api = {
  listUsers: () => request<User[]>("GET", "/users"),
  createUser: (input: { name: string; zip: string }) => request<User>("POST", "/users", input),
  updateUser: (id: string, patch: { name?: string; zip?: string }) => request<User>("PATCH", `/users/${id}`, patch),
  deleteUser: (id: string, init?: RequestInit) => request<void>("DELETE", `/users/${id}`, undefined, init),
  refreshLocation: (id: string) => request<User>("POST", `/users/${id}/refresh-location`),
  lookupZip: (zip: string) => request<ZipPreview>("GET", `/zip/${zip}`),
};
