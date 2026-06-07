import { describe, expect, it } from "vitest";
import {
  hashWorldSource,
  parseWorldSummaryResponse,
  shouldUseAiSummary,
} from "../src/scripts/api/world-summary-service.js";

describe("shouldUseAiSummary", () => {
  it("uses AI only in ai mode or hybrid refresh", () => {
    expect(shouldUseAiSummary("excerpt", false)).toBe(false);
    expect(shouldUseAiSummary("excerpt", true)).toBe(false);
    expect(shouldUseAiSummary("ai", false)).toBe(true);
    expect(shouldUseAiSummary("hybrid", false)).toBe(false);
    expect(shouldUseAiSummary("hybrid", true)).toBe(true);
  });
});

describe("parseWorldSummaryResponse", () => {
  it("splits summary and follow-up lines", () => {
    const result = parseWorldSummaryResponse(
      "The harbor town is tense.\n\nFOLLOW_UP: Who controls the docks?",
    );

    expect(result.text).toBe("The harbor town is tense.");
    expect(result.followUp).toBe("Who controls the docks?");
  });

  it("returns the full text when no follow-up marker exists", () => {
    const result = parseWorldSummaryResponse("A short summary.");
    expect(result.text).toBe("A short summary.");
    expect(result.followUp).toBe("");
  });
});

describe("hashWorldSource", () => {
  it("returns a stable hash for the same input", () => {
    expect(hashWorldSource("world")).toBe(hashWorldSource("world"));
    expect(hashWorldSource("world")).not.toBe(hashWorldSource("other"));
  });
});
