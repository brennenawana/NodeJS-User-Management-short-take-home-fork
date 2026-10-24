import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { UsersRepo } from "../core/ports.js";
import { createJsonFileRepo } from "./json-file/index.js";
import { createMemoryRepo } from "./memory/index.js";
import * as upstashRedis from "./upstash-redis/index.js";

// Relative DATA_FILE paths are read from the repo root, whatever the working directory.
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

export const storages = {
  "json-file": (env: NodeJS.ProcessEnv) => createJsonFileRepo(resolve(repoRoot, env.DATA_FILE ?? "data/users.json")),
  memory: () => createMemoryRepo(),
  "upstash-redis": upstashRedis.fromEnv,
} satisfies Record<string, (env: NodeJS.ProcessEnv) => UsersRepo>;

export type StorageName = keyof typeof storages;
