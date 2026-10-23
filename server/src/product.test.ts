import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { product } from "./product.js";

// Files that can't import product.json still have to agree with it.
const root = new URL("../../", import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), "utf8");

test("the readme title is the product name", () => {
  const title = read("README.md").split("\n")[0];
  assert.equal(title, `# ${product.name}`);
});

test("every package name starts with the product slug", () => {
  const dirs = [".", ...readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/package.json`, root)))
    .map((d) => d.name)];
  assert.ok(dirs.length > 1, "expected the root and at least one workspace");
  for (const dir of dirs) {
    const { name } = JSON.parse(read(`${dir}/package.json`));
    assert.match(name, new RegExp(`^${product.slug}(-|$)`), `${dir}/package.json is named ${name}`);
  }
});
