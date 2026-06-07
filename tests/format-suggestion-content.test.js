import { describe, expect, it } from "vitest";
import { formatSuggestionContent } from "../src/scripts/journal/assistant-content-service.js";

describe("formatSuggestionContent", () => {
  it("wraps plain text paragraphs in HTML", () => {
    expect(formatSuggestionContent("Line one\n\nLine two")).toBe("<p>Line one</p><p>Line two</p>");
  });

  it("returns HTML content unchanged", () => {
    expect(formatSuggestionContent("<h2>Title</h2><p>Body</p>")).toBe("<h2>Title</h2><p>Body</p>");
  });
});
