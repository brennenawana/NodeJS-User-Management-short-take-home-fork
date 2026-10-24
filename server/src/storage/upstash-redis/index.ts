import { z } from "zod";
import type { UsersRepo } from "../../core/ports.js";
import { userSchema, type User } from "../../core/user.js";

type Fetch = typeof globalThis.fetch;

export interface UpstashOptions {
  url: string;
  token: string;
  /** The Redis hash that holds every user, keyed by id. */
  key?: string;
  fetch?: Fetch;
}

// Error first: `result: unknown` would also match a reply that only has `error`.
const reply = z.union([z.object({ error: z.string() }), z.object({ result: z.unknown() })]);

/** Users in one Redis hash, over Upstash's REST API. Records are validated on the way out. */
export function createUpstashRepo({ url, token, key = "users", fetch = globalThis.fetch }: UpstashOptions): UsersRepo {
  async function command(...args: string[]): Promise<unknown> {
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(args),
    });
    const body = reply.parse(await res.json().catch(() => ({ error: `HTTP ${res.status}` })));
    if ("error" in body) throw new Error(`Upstash ${args[0]} failed: ${body.error}`);
    return body.result;
  }

  const parse = (raw: unknown): User => userSchema.parse(JSON.parse(String(raw)));

  return {
    async list() {
      const flat = z.array(z.string()).parse(await command("HGETALL", key));
      const users: User[] = [];
      for (let i = 1; i < flat.length; i += 2) users.push(parse(flat[i]));
      return users;
    },
    async get(id) {
      const raw = await command("HGET", key, id);
      return raw == null ? undefined : parse(raw);
    },
    async create(user) {
      await command("HSET", key, user.id, JSON.stringify(user));
    },
    async update(user) {
      await command("HSET", key, user.id, JSON.stringify(user));
    },
    async delete(id) {
      return (await command("HDEL", key, id)) === 1;
    },
  };
}

/** Vercel's Upstash integration sets KV_REST_API_*; Upstash itself uses UPSTASH_REDIS_REST_*. */
export function fromEnv(env: NodeJS.ProcessEnv): UsersRepo {
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("STORAGE=upstash-redis needs KV_REST_API_URL and KV_REST_API_TOKEN (see .env.example)");
  return createUpstashRepo({ url, token, key: env.REDIS_KEY });
}
