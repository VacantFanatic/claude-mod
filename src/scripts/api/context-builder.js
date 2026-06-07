import { collectJournalContext } from "../journal/journal-service.js";

/**
 * Builds optional journal text for the API system prompt.
 * @returns {Promise<{ systemSection: string, metadata: Record<string, unknown> }>}
 */
export async function buildJournalSystemSection() {
  const { entries, truncated } = await collectJournalContext();

  if (!entries.length) {
    return { systemSection: "", metadata: { journals: [] } };
  }

  const header = game.i18n.localize("CLAUDE-MOD.Journal.ContextHeader");
  const sections = entries.map((entry) => `## ${entry.name}\n${entry.text}`);
  let systemSection = `${header}\n\n${sections.join("\n\n")}`;

  if (truncated) {
    systemSection += `\n\n${game.i18n.localize("CLAUDE-MOD.Journal.ContextTruncated")}`;
  }

  return {
    systemSection,
    metadata: {
      journals: entries.map((e) => ({ id: e.id, name: e.name, length: e.text.length })),
      truncated,
    },
  };
}
