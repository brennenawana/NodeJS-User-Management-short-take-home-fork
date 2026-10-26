import { expect, test } from "vitest";
import { located, pending } from "../mocks/fake-api";
import { avatarHue, byTime, initialsOf } from "./people";

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

test("by time puts whoever is furthest behind first, ties by name, unlocated last", () => {
  const users = [
    pending("Noor Haddad", "99999", "noor", "invalidZip"),
    located("Maya Okafor", "10001", "maya"),
    located("Daniel Reyes", "94103", "daniel"),
    pending("Ada Lowe", "02108", "ada"),
    located("Lena Hoffmann", "02108", "lena"),
    located("Priya Raman", "60601", "priya"),
  ];
  expect(byTime(users, -21600).map((u) => u.name)).toEqual(["Daniel Reyes", "Priya Raman", "Lena Hoffmann", "Maya Okafor", "Ada Lowe", "Noor Haddad"]);
});
