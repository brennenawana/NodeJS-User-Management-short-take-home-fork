import type { UsersRepo } from "../../core/ports.js";
import type { User } from "../../core/user.js";

export function createMemoryRepo(seed: User[] = []): UsersRepo {
  const rows = new Map(seed.map((u) => [u.id, structuredClone(u)]));
  return {
    async list() { return [...rows.values()].map((u) => structuredClone(u)); },
    async get(id) { const u = rows.get(id); return u && structuredClone(u); },
    async create(user) { rows.set(user.id, structuredClone(user)); },
    async update(user) { rows.set(user.id, structuredClone(user)); },
    async delete(id) { return rows.delete(id); },
  };
}
