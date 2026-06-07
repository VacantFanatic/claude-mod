import { describe, expect, it } from "vitest";
import {
  buildPageTemplate,
  formatRecentItemDate,
  getQuickCreateTypes,
  sortRecentItems,
} from "../src/scripts/journal/assistant-content-service.js";

describe("formatRecentItemDate", () => {
  it("formats a timestamp as short month and day", () => {
    const label = formatRecentItemDate(Date.UTC(2026, 0, 31), "en-US");
    expect(label).toBe("Jan 31");
  });
});

describe("getQuickCreateTypes", () => {
  it("returns ten journal quick-create types", () => {
    expect(getQuickCreateTypes()).toHaveLength(10);
  });

  it("includes stable ids and icons for each type", () => {
    const types = getQuickCreateTypes();
    expect(types.map((type) => type.id)).toEqual([
      "session",
      "npc",
      "location",
      "storyArc",
      "encounter",
      "playerCharacter",
      "lore",
      "sceneOutline",
      "secretsClues",
      "magicItem",
    ]);
    for (const type of types) {
      expect(type.icon).toMatch(/^fa-/);
      expect(type.labelKey).toBeTruthy();
    }
  });
});

describe("buildPageTemplate", () => {
  it("returns html with the provided name for an npc", () => {
    const html = buildPageTemplate("npc", "Captain Vex");
    expect(html).toContain("Captain Vex");
    expect(html).toContain("<");
  });

  it("returns a generic template for unknown types", () => {
    const html = buildPageTemplate("unknown", "Test");
    expect(html).toContain("Test");
  });
});

describe("sortRecentItems", () => {
  it("sorts by timestamp descending and limits results", () => {
    const sorted = sortRecentItems(
      [
        { id: "a", timestamp: 100 },
        { id: "b", timestamp: 300 },
        { id: "c", timestamp: 200 },
      ],
      2,
    );

    expect(sorted.map((item) => item.id)).toEqual(["b", "c"]);
  });
});
