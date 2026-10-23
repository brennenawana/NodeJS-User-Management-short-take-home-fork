import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type { UsersRepo } from "../../core/ports.js";
import { userSchema, type User } from "../../core/user.js";

const fileSchema = z.object({ users: z.array(userSchema) });

export class CorruptDataFile extends Error {
  constructor(path: string, options: { cause: unknown }) {
    super(`${path} does not hold valid user records`, options);
    this.name = "CorruptDataFile";
  }
}

/** Keeps every user in one JSON file. Writes go to a temp file and are renamed into place. */
export function createJsonFileRepo(path: string): UsersRepo {
  let queue: Promise<unknown> = Promise.resolve();

  async function load(): Promise<User[]> {
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    try {
      return fileSchema.parse(JSON.parse(raw)).users;
    } catch (cause) {
      throw new CorruptDataFile(path, { cause });
    }
  }

  async function save(users: User[]) {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify({ users }, null, 2) + "\n");
    await rename(tmp, path);
  }

  // Serialise read-modify-write cycles so concurrent requests can't drop each other's changes.
  function mutate<T>(fn: (users: User[]) => { users: User[]; result: T }): Promise<T> {
    const run = queue.then(async () => {
      const { users, result } = fn(await load());
      await save(users);
      return result;
    });
    queue = run.catch(() => undefined);
    return run;
  }

  return {
    async list() { await queue; return load(); },
    async get(id) { await queue; return (await load()).find((u) => u.id === id); },
    create: (user) => mutate((users) => ({ users: [...users, user], result: undefined })),
    update: (user) => mutate((users) => ({ users: users.map((u) => (u.id === user.id ? user : u)), result: undefined })),
    delete: (id) => mutate((users) => {
      const kept = users.filter((u) => u.id !== id);
      return { users: kept, result: kept.length !== users.length };
    }),
  };
}
