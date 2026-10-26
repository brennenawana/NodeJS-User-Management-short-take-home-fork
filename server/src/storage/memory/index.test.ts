import { createMemoryRepo } from "./index.js";
import { repoContract } from "../../../test/repo-contract.js";

repoContract("memory", () => createMemoryRepo());
