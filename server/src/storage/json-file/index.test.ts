import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJsonFileRepo, CorruptDataFile } from "./index.js";
import { repoContract } from "../../../test/repo-contract.js";

const tempFile = async () => join(await mkdtemp(join(tmpdir(), "users-")), "nested", "users.json");

repoContract("json-file", async () => createJsonFileRepo(await tempFile()));

test("json-file survives a restart", async () => {
  const path = await tempFile();
  await createJsonFileRepo(path).create({
    id: "a", name: "Sam", zip: "78701", city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null, locationStatus: "pending",
  });
  assert.equal((await createJsonFileRepo(path).list())[0]?.name, "Sam");
  assert.match(await readFile(path, "utf8"), /"users"/);
});

test("json-file refuses records that don't validate", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "users-")), "users.json");
  await writeFile(path, JSON.stringify({ users: [{ id: "a", name: "Sam", zip: "787" }] }));
  await assert.rejects(createJsonFileRepo(path).list(), CorruptDataFile);
});

test("json-file reads records saved before locationStatus existed", async () => {
  const path = join(await mkdtemp(join(tmpdir(), "users-")), "users.json");
  await writeFile(path, JSON.stringify({ users: [
    { id: "a", name: "Lena", zip: "02108", city: "Boston", lat: 42.36, lon: -71.07, utcOffsetSeconds: -14400, locationUpdatedAt: "2026-10-19T16:50:00.000Z" },
    { id: "b", name: "Noor", zip: "02108", city: null, lat: null, lon: null, utcOffsetSeconds: null, locationUpdatedAt: null },
  ] }));
  const [lena, noor] = await createJsonFileRepo(path).list();
  assert.equal(lena?.locationStatus, "located");
  assert.equal(noor?.locationStatus, "pending");
});
