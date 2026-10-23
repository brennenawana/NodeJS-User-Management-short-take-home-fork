import { expect, test } from "vitest";
import { avatarHue, initialsOf } from "./people";

test("avatar hues match the buckets recorded in the Figma file", () => {
  // design/figma/state.json → decisions.avatarHues
  const expected = { "Maya Okafor": 210, "Daniel Reyes": 90, "Priya Raman": 120, "Tomás Lindqvist": 240, "Grace Whitfield": 300, "Jonah Abernathy": 30, "Lena Hoffmann": 120, "Sam Castillo": 30, "Noor Haddad": 240 };
  for (const [name, hue] of Object.entries(expected)) expect(avatarHue(name), name).toBe(hue);
});

test("initials", () => {
  expect(initialsOf("Maya Okafor")).toBe("MO");
  expect(initialsOf("  cher ")).toBe("C");
  expect(initialsOf("Mary Ann van der Berg")).toBe("MB");
  expect(initialsOf("")).toBe("?");
});
