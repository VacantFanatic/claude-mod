import { collectJournalContext } from "../journal/journal-service.js";

/**
 * Builds optional game context to prepend to Claude prompts.
 * @returns {Promise<{ prefix: string, metadata: Record<string, unknown> }>}
 */
export async function buildContext() {
  const { entries, truncated } = await collectJournalContext();

  if (!entries.length) {
    return { prefix: "", metadata: { journals: [] } };
  }

  const header = game.i18n.localize("CLAUDE-MOD.Journal.ContextHeader");
  const sections = entries.map((entry) => `## ${entry.name}\n${entry.text}`);
  let prefix = `${header}\n\n${sections.join("\n\n")}`;

  if (truncated) {
    prefix += `\n\n${game.i18n.localize("CLAUDE-MOD.Journal.ContextTruncated")}`;
  }

  return {
    prefix,
    metadata: {
      journals: entries.map((e) => ({ id: e.id, name: e.name, length: e.text.length })),
      truncated,
    },
  };
}
