import type { APIRequestContext } from "@playwright/test";

/** Every test starts from an empty list on the shared in-memory API. */
export async function removeEveryone(request: APIRequestContext) {
  const users: { id: string }[] = await (await request.get("/api/users")).json();
  await Promise.all(users.map((u) => request.delete(`/api/users/${u.id}`)));
}
