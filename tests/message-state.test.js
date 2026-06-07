import { describe, expect, it } from "vitest";
import {
  appendMessage,
  clearMessages,
  createMessage,
  messagesFromHistory,
  shouldScrollToBottom,
} from "../src/scripts/chat/message-state.js";

describe("createMessage", () => {
  it("creates a message with role, content, and id", () => {
    const message = createMessage("user", "Hello");
    expect(message.role).toBe("user");
    expect(message.content).toBe("Hello");
    expect(message.id).toBeTruthy();
    expect(message.timestamp).toBeTypeOf("number");
  });
});

describe("appendMessage", () => {
  it("appends a message to the list", () => {
    const messages = appendMessage([], "user", "First");
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("First");
  });

  it("does not mutate the original array", () => {
    const original = [];
    const next = appendMessage(original, "assistant", "Reply");
    expect(original).toHaveLength(0);
    expect(next).toHaveLength(1);
  });
});

describe("clearMessages", () => {
  it("returns an empty array", () => {
    expect(clearMessages()).toEqual([]);
  });
});

describe("messagesFromHistory", () => {
  it("maps Claude history entries to UI messages", () => {
    const messages = messagesFromHistory([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
    ]);
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("user");
    expect(messages[1].role).toBe("assistant");
  });

  it("ignores unknown roles", () => {
    const messages = messagesFromHistory([{ role: "system", content: "ignored" }]);
    expect(messages).toHaveLength(0);
  });
});

describe("shouldScrollToBottom", () => {
  it("returns true when the user is near the bottom", () => {
    expect(shouldScrollToBottom({ scrollTop: 900, scrollHeight: 1000, clientHeight: 120 })).toBe(true);
  });

  it("returns false when the user has scrolled up", () => {
    expect(shouldScrollToBottom({ scrollTop: 100, scrollHeight: 1000, clientHeight: 120 })).toBe(false);
  });
});
