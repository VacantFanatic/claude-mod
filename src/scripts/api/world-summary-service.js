import { MODULE_ID } from "../constants.js";
import { collectJournalContext } from "../journal/journal-service.js";
import { ClaudeService } from "./claude-service.js";

const DEFAULT_DISPLAY_MAX_CHARS = 1200;
const FOLLOW_UP_PATTERN = /^FOLLOW_UP:\s*(.+)$/ims;

/**
 * @param {"excerpt"|"ai"|"hybrid"} mode
 * @param {boolean} forceRefresh
 */
export function shouldUseAiSummary(mode, forceRefresh) {
  if (mode === "ai") return true;
  if (mode === "hybrid" && forceRefresh) return true;
  return false;
}

/**
 * @param {string} text
 */
export function hashWorldSource(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return String(hash);
}

/**
 * @param {string} responseText
 */
export function parseWorldSummaryResponse(responseText) {
  const match = responseText.match(FOLLOW_UP_PATTERN);
  if (!match) {
    return { text: responseText.trim(), followUp: "" };
  }

  return {
    text: responseText.slice(0, match.index).trim(),
    followUp: match[1].trim(),
  };
}

/**
 * @param {string} excerpt
 */
export function buildWorldSummaryPrompt(excerpt) {
  return [
    "Summarize this tabletop RPG campaign world for the Game Master in 2-4 concise paragraphs.",
    "Use only facts present in the source material. Do not invent new lore.",
    'End your reply with a single line starting with "FOLLOW_UP:" and one short question the GM could develop next.',
    "",
    "Source journals:",
    excerpt,
  ].join("\n");
}

/**
 * @param {Array<{ id: string, name: string, text: string }>} entries
 * @param {{ maxChars?: number, sourceTruncated?: boolean }} [options]
 */
export function buildWorldExcerpt(entries, { maxChars = DEFAULT_DISPLAY_MAX_CHARS, sourceTruncated = false } = {}) {
  if (!entries?.length) {
    return { text: "", truncated: false, journalCount: 0 };
  }

  const sections = entries.map((entry) => `${entry.name}\n${entry.text.trim()}`);
  let text = sections.join("\n\n");
  let truncated = sourceTruncated;

  if (text.length > maxChars) {
    const sliceEnd = Math.max(0, maxChars - 1);
    text = `${text.slice(0, sliceEnd).trimEnd()}…`;
    truncated = true;
  }

  return {
    text,
    truncated,
    journalCount: entries.length,
  };
}

/**
 * @param {string} excerpt
 * @returns {Promise<{ text: string, followUp: string }>}
 */
async function generateAiWorldSummary(excerpt) {
  const prompt = buildWorldSummaryPrompt(excerpt);
  const result = await ClaudeService.getInstance().sendStandaloneMessage(prompt, {
    system:
      "You write concise campaign summaries for a Foundry VTT game master. Stay faithful to the provided journal text.",
  });
  return parseWorldSummaryResponse(result.text);
}

/**
 * @param {{ maxChars?: number, forceRefresh?: boolean, mode?: "excerpt"|"ai"|"hybrid" }} [options]
 * @returns {Promise<{
 *   text: string,
 *   truncated: boolean,
 *   journalCount: number,
 *   source: "excerpt"|"ai",
 *   followUp: string
 * }>}
 */
export async function getWorldSummary({
  maxChars = DEFAULT_DISPLAY_MAX_CHARS,
  forceRefresh = false,
  mode,
} = {}) {
  const { entries, truncated } = await collectJournalContext();
  const excerptResult = buildWorldExcerpt(entries, { maxChars, sourceTruncated: truncated });
  const effectiveMode = mode ?? game.settings.get(MODULE_ID, "worldSummaryMode") ?? "hybrid";
  const defaultFollowUp = game.i18n.localize("CLAUDE-MOD.CampaignAssistant.WorldFollowUp");

  if (!excerptResult.text) {
    return {
      text: "",
      truncated: false,
      journalCount: 0,
      source: "excerpt",
      followUp: defaultFollowUp,
    };
  }

  if (!shouldUseAiSummary(effectiveMode, forceRefresh)) {
    return {
      ...excerptResult,
      source: "excerpt",
      followUp: defaultFollowUp,
    };
  }

  const sourceHash = hashWorldSource(excerptResult.text);
  const cache = game.settings.get(MODULE_ID, "worldSummaryCache") ?? {};

  if (!forceRefresh && cache.hash === sourceHash && cache.text) {
    return {
      text: cache.text,
      truncated: excerptResult.truncated,
      journalCount: excerptResult.journalCount,
      source: "ai",
      followUp: cache.followUp || defaultFollowUp,
    };
  }

  const aiSummary = await generateAiWorldSummary(excerptResult.text);
  await game.settings.set(MODULE_ID, "worldSummaryCache", {
    hash: sourceHash,
    text: aiSummary.text,
    followUp: aiSummary.followUp,
    updatedAt: Date.now(),
  });

  return {
    text: aiSummary.text,
    truncated: excerptResult.truncated,
    journalCount: excerptResult.journalCount,
    source: "ai",
    followUp: aiSummary.followUp || defaultFollowUp,
  };
}
