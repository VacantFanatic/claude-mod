import { describe, expect, it } from "vitest";
import { parseClaudeSlashMessage, parseClaudeWhisper } from "../src/scripts/chat/chat-commands.js";

describe("parseClaudeSlashMessage", () => {
  it("parses /claude with a question", () => {
    expect(parseClaudeSlashMessage("/claude Who is the mayor?")).toBe("Who is the mayor?");
  });

  it("returns null when /claude has no question text", () => {
    expect(parseClaudeSlashMessage("/claude")).toBeNull();
    expect(parseClaudeSlashMessage("/claude   ")).toBeNull();
  });

  it("returns false for unrelated messages", () => {
    expect(parseClaudeSlashMessage("/roll 1d20")).toBe(false);
  });
});

describe("parseClaudeWhisper", () => {
  it("parses /w claude whispers", () => {
    expect(parseClaudeWhisper("/w claude Tell me about the city")).toBe("Tell me about the city");
    expect(parseClaudeWhisper("/w gm-claude Need an encounter")).toBe("Need an encounter");
  });

  it("returns empty string when the alias matches without a question", () => {
    expect(parseClaudeWhisper("/w claude")).toBe("");
  });

  it("returns false for unrelated whispers", () => {
    expect(parseClaudeWhisper("/w gm Hello")).toBe(false);
  });
});
