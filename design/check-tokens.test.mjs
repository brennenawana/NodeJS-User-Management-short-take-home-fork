// Fails when design/tokens.css drifts from the Figma export in design/tokens.json.
// Run: node --test design/check-tokens.test.mjs (or yarn check:tokens)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const figma = JSON.parse(read("design/tokens.json"));
const css = read("design/tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
const product = JSON.parse(read("product.json"));

function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, `tokens.css has a ${selector} block`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));
}

const light = block(":root");
const dark = block('[data-theme="dark"]');
const prop = (codeSyntax) => codeSyntax.match(/^var\(--([a-z0-9-]+)\)$/)?.[1];
const UNITS = { Motion: "ms" };
const cssValue = (value, type, collection) =>
  typeof value === "object" ? value.codeSyntax : type === "FLOAT" ? `${value}${UNITS[collection] ?? "px"}` : value;
const same = (a, b) => a?.toLowerCase() === b?.toLowerCase();

const cssCollections = ["Primitives", "Color", "Spacing", "Radius", "Motion"];

for (const name of cssCollections) {
  test(`${name} variables match tokens.css`, () => {
    const { modes, variables } = figma.collections[name];
    for (const v of variables) {
      const p = prop(v.codeSyntax);
      assert.ok(p, `${name}/${v.name} has a var(--…) code syntax`);
      for (const mode of modes) {
        const sheet = mode === "Dark" ? dark : light;
        const want = cssValue(v.values[mode], v.type, name);
        assert.ok(same(sheet[p], want), `--${p} (${mode}) is ${sheet[p]} in tokens.css but ${want} in Figma`);
      }
    }
  });
}

test("tokens.css has no variable-backed properties that Figma doesn't", () => {
  const known = new Set(cssCollections.flatMap((n) => figma.collections[n].variables.map((v) => prop(v.codeSyntax))));
  const orphans = [...Object.keys(light), ...Object.keys(dark)]
    .filter((k) => /^(palette|color|space|radius|motion)-/.test(k) && !known.has(k));
  assert.deepEqual(orphans, []);
});

test("the Product collection matches product.json", () => {
  for (const v of figma.collections.Product.variables) {
    const key = v.codeSyntax.replace(/^product\./, "");
    assert.equal(v.values.Value, product[key], `${v.name} vs product.json ${key}`);
  }
});

const WEIGHTS = { Regular: 400, SemiBold: 600, Bold: 700, ExtraBold: 800 };

test("text styles match the --text-* shorthands, in rem", () => {
  assert.match(light["font-family"], new RegExp(`^'${figma.textStyles[0].fontFamily}'`));
  for (const s of figma.textStyles) {
    const p = s.name.replace("/", "-").replaceAll(" ", "-");
    // Figma works in px; the CSS uses rem (px / 16) so text follows the reader's browser font size.
    const rem = (px) => `${px / 16}rem`;
    const expected = `${WEIGHTS[s.fontStyle]} ${rem(s.fontSize)}/${rem(s.lineHeight.value)} var(--font-family)`;
    assert.equal(light[p], expected, `--${p}`);
    const tracking = s.letterSpacing.value / 100;
    if (tracking) assert.equal(light[`${p}-tracking`], `${tracking}em`, `--${p}-tracking`);
    if (s.textCase === "UPPER") assert.equal(light[`${p}-case`], "uppercase", `--${p}-case`);
  }
});
