import { collectJournalContext } from "../journal/journal-service.js";

const DEFAULT_DISPLAY_MAX_CHARS = 1200;

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
 * @param {{ maxChars?: number }} [options]
 * @returns {Promise<{ text: string, truncated: boolean, journalCount: number }>}
 */
export async function getWorldSummary({ maxChars = DEFAULT_DISPLAY_MAX_CHARS } = {}) {
  const { entries, truncated } = await collectJournalContext();
  return buildWorldExcerpt(entries, { maxChars, sourceTruncated: truncated });
}
