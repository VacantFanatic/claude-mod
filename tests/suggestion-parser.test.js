import { describe, expect, it } from "vitest";
import {
  buildSuggestionsSystemInstruction,
  createSuggestionsFromRaw,
  parseAssistantResponse,
  removeSuggestion,
} from "../src/scripts/api/suggestion-parser.js";

describe("parseAssistantResponse", () => {
  it("returns the full text when no suggestions block is present", () => {
    const result = parseAssistantResponse("Here is some campaign advice.");
    expect(result.text).toBe("Here is some campaign advice.");
    expect(result.suggestions).toEqual([]);
  });

  it("strips the suggestions block and parses entries", () => {
    const response = `Here is an NPC idea.

---CLAUDE-MOD-SUGGESTIONS---
{"suggestions":[{"type":"npc","title":"Captain Vex","tags":["NPC"],"content":"A cautious harbor guard."}]}`;

    const result = parseAssistantResponse(response);
    expect(result.text).toBe("Here is an NPC idea.");
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].title).toBe("Captain Vex");
    expect(result.suggestions[0].type).toBe("npc");
  });

  it("ignores invalid suggestion payloads", () => {
    const response = `Advice.

---CLAUDE-MOD-SUGGESTIONS---
{"suggestions":[{"type":"npc"},{"title":"No type"},{"type":"npc","title":"Valid","content":"Text"}]}`;

    const result = parseAssistantResponse(response);
    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].title).toBe("Valid");
  });
});

describe("createSuggestionsFromRaw", () => {
  it("assigns ids, icons, and tag labels", () => {
    const suggestions = createSuggestionsFromRaw([
      { type: "lore", title: "Ancient Pact", tags: ["LORE", "SECRET"], content: "Details" },
    ]);

    expect(suggestions[0].id).toMatch(/^sug-/);
    expect(suggestions[0].icon).toBe("fa-bookmark");
    expect(suggestions[0].tagLabels).toBe("LORE, SECRET");
  });
});

describe("removeSuggestion", () => {
  it("removes a suggestion by id", () => {
    const next = removeSuggestion(
      [
        { id: "a", title: "One" },
        { id: "b", title: "Two" },
      ],
      "a",
    );

    expect(next).toEqual([{ id: "b", title: "Two" }]);
  });
});

describe("buildSuggestionsSystemInstruction", () => {
  it("includes the marker format", () => {
    expect(buildSuggestionsSystemInstruction()).toContain("---CLAUDE-MOD-SUGGESTIONS---");
  });
});
