import { createMemoryRepo } from "./index.js";
import { repoContract } from "../repo-contract.js";

repoContract("memory", () => createMemoryRepo());
