import { describe, expect, it } from "vitest";
import names from "../data/names";
import themes from "../data/nameThemes";
import { findNameBySlug, nameSlug } from "./nameRoutes";

describe("public Name discovery routes", () => {
  it("creates a unique, reversible URL for all 99 entries", () => {
    const slugs = names.map((card, index) => nameSlug(card, index));
    expect(slugs).toHaveLength(99);
    expect(new Set(slugs).size).toBe(99);
    slugs.forEach((slug, index) => expect(findNameBySlug(slug)).toBe(names[index]));
  });

  it("contains only valid Names in every themed collection", () => {
    const available = new Set(names.map((card) => card.name));
    themes.forEach((theme) => {
      expect(theme.names.length).toBeGreaterThanOrEqual(5);
      theme.names.forEach((name) => expect(available.has(name)).toBe(true));
    });
  });
});
