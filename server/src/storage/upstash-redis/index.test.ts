import { test } from "node:test";
import assert from "node:assert/strict";
import { createUpstashRepo, fromEnv } from "./index.js";
import { repoContract } from "../repo-contract.js";

/** Answers the four hash commands the repo uses, the way Upstash's REST API does. */
function fakeUpstash() {
  const hashes = new Map<string, Map<string, string>>();
  const seen: { auth: string | null; command: string[] }[] = [];
  const fetch: typeof globalThis.fetch = async (_url, init) => {
    const [cmd, key, field, value] = JSON.parse(String(init?.body)) as string[];
    seen.push({ auth: new Headers(init?.headers).get("authorization"), command: [cmd!, key!, field ?? ""] });
    const hash = hashes.get(key!) ?? new Map<string, string>();
    hashes.set(key!, hash);
    const ok = (result: unknown) => Response.json({ result });
    switch (cmd) {
      case "HGETALL": return ok([...hash].flat());
      case "HGET": return ok(hash.get(field!) ?? null);
      case "HSET": { const added = hash.has(field!) ? 0 : 1; hash.set(field!, value!); return ok(added); }
      case "HDEL": return ok(hash.delete(field!) ? 1 : 0);
      default: return Response.json({ error: `ERR unknown command '${cmd}'` }, { status: 400 });
    }
  };
  return { fetch, seen, hashes };
}

repoContract("upstash-redis", () => createUpstashRepo({ url: "https://example.upstash.io", token: "t", fetch: fakeUpstash().fetch }));

test("upstash-redis sends the token and keeps users in one hash", async () => {
  const upstash = fakeUpstash();
  const repo = createUpstashRepo({ url: "https://example.upstash.io", token: "secret", key: "team", fetch: upstash.fetch });
  await repo.list();
  assert.deepEqual(upstash.seen[0], { auth: "Bearer secret", command: ["HGETALL", "team", ""] });
});

test("upstash-redis surfaces Upstash errors", async () => {
  const fetch: typeof globalThis.fetch = async () => Response.json({ error: "WRONGPASS invalid password" }, { status: 401 });
  await assert.rejects(createUpstashRepo({ url: "https://x", token: "bad", fetch }).list(), /WRONGPASS/);
});

test("upstash-redis refuses records that don't validate", async () => {
  const upstash = fakeUpstash();
  upstash.hashes.set("users", new Map([["a", JSON.stringify({ id: "a", name: "Sam", zip: "787" })]]));
  await assert.rejects(createUpstashRepo({ url: "https://x", token: "t", fetch: upstash.fetch }).list());
});

test("fromEnv takes Vercel's or Upstash's variable names, and needs one of them", () => {
  assert.ok(fromEnv({ KV_REST_API_URL: "https://x", KV_REST_API_TOKEN: "t" }));
  assert.ok(fromEnv({ UPSTASH_REDIS_REST_URL: "https://x", UPSTASH_REDIS_REST_TOKEN: "t" }));
  assert.throws(() => fromEnv({}), /KV_REST_API_URL/);
});
