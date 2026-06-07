import { describe, expect, it } from "vitest";
import { buildWorldExcerpt } from "../scripts/api/world-summary-service.js";

describe("buildWorldExcerpt", () => {
  it("returns empty text when there are no journal entries", () => {
    expect(buildWorldExcerpt([])).toEqual({
      text: "",
      truncated: false,
      journalCount: 0,
    });
  });

  it("combines journal entries into a readable excerpt", () => {
    const result = buildWorldExcerpt([
      { id: "a", name: "World", text: "A coastal kingdom." },
      { id: "b", name: "NPCs", text: "The mayor is cautious." },
    ]);

    expect(result.journalCount).toBe(2);
    expect(result.text).toContain("World");
    expect(result.text).toContain("A coastal kingdom.");
    expect(result.text).toContain("NPCs");
    expect(result.truncated).toBe(false);
  });

  it("truncates long excerpts", () => {
    const longText = "x".repeat(2000);
    const result = buildWorldExcerpt([{ id: "a", name: "Lore", text: longText }], { maxChars: 500 });

    expect(result.text.length).toBeLessThanOrEqual(500);
    expect(result.truncated).toBe(true);
  });

  it("marks truncated when source entries were already truncated", () => {
    const result = buildWorldExcerpt([{ id: "a", name: "World", text: "Short text." }], {
      sourceTruncated: true,
    });

    expect(result.truncated).toBe(true);
  });
});
