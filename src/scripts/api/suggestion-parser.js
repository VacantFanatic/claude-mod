import { QUICK_CREATE_TYPE_DEFS } from "../journal/assistant-content-service.js";

export const SUGGESTIONS_MARKER = "---CLAUDE-MOD-SUGGESTIONS---";
const VALID_TYPES = new Set(QUICK_CREATE_TYPE_DEFS.map((type) => type.id));
const TYPE_ICONS = Object.fromEntries(QUICK_CREATE_TYPE_DEFS.map((type) => [type.id, type.icon]));

/**
 * @returns {string}
 */
export function buildSuggestionsSystemInstruction() {
  const types = QUICK_CREATE_TYPE_DEFS.map((type) => type.id).join(", ");
  return [
    "When you propose concrete campaign content the GM could save as Foundry journal entries, append a single JSON block after your reply using this exact format (no markdown fences):",
    SUGGESTIONS_MARKER,
    '{"suggestions":[{"type":"one of: ' + types + '","title":"Short title","tags":["TAG"],"content":"Plain text or simple HTML for the journal page"}]}',
    "Only include the block when you have specific suggestions. Maximum 3 suggestions per reply.",
  ].join("\n");
}

/**
 * @param {string} responseText
 * @returns {{ text: string, suggestions: Array<{ type: string, title: string, tags: string[], content: string }> }}
 */
export function parseAssistantResponse(responseText) {
  const markerIndex = responseText.lastIndexOf(SUGGESTIONS_MARKER);
  if (markerIndex === -1) {
    return { text: responseText.trim(), suggestions: [] };
  }

  const text = responseText.slice(0, markerIndex).trim();
  const jsonPart = responseText.slice(markerIndex + SUGGESTIONS_MARKER.length).trim();

  try {
    const parsed = JSON.parse(jsonPart);
    const suggestions = normalizeRawSuggestions(parsed?.suggestions);
    return { text, suggestions };
  } catch {
    return { text: responseText.trim(), suggestions: [] };
  }
}

/**
 * @param {unknown} rawSuggestions
 */
function normalizeRawSuggestions(rawSuggestions) {
  if (!Array.isArray(rawSuggestions)) return [];

  /** @type {Array<{ type: string, title: string, tags: string[], content: string }>} */
  const normalized = [];

  for (const entry of rawSuggestions.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;

    const title = String(entry.title ?? "").trim();
    const type = normalizeSuggestionType(entry.type);
    const content = String(entry.content ?? "").trim();
    if (!title || !type || !content) continue;

    const tags = Array.isArray(entry.tags)
      ? entry.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 3)
      : [];

    normalized.push({ type, title, tags, content });
  }

  return normalized;
}

/**
 * @param {unknown} type
 */
function normalizeSuggestionType(type) {
  const raw = String(type ?? "").trim();
  if (!raw) return null;

  const normalized = raw
    .replace(/[\s-]+/g, "")
    .replace(/^playercharacter$/i, "playerCharacter")
    .replace(/^storyarc$/i, "storyArc")
    .replace(/^sceneoutline$/i, "sceneOutline")
    .replace(/^secretsclues$/i, "secretsClues")
    .replace(/^magicitem$/i, "magicItem");

  if (VALID_TYPES.has(normalized)) return normalized;
  if (VALID_TYPES.has(raw)) return raw;
  return null;
}

/**
 * @param {Array<{ type: string, title: string, tags?: string[], content?: string }>} rawSuggestions
 * @param {number} [timestamp]
 */
export function createSuggestionsFromRaw(rawSuggestions, timestamp = Date.now()) {
  return rawSuggestions.map((entry, index) => ({
    id: `sug-${timestamp}-${index}`,
    type: entry.type,
    title: entry.title,
    tags: entry.tags ?? [],
    tagLabels: (entry.tags ?? []).join(", "),
    content: entry.content ?? "",
    icon: TYPE_ICONS[entry.type] ?? "fa-bookmark",
  }));
}

/**
 * @param {Array<{ id: string }>} suggestions
 * @param {string} id
 */
export function removeSuggestion(suggestions, id) {
  return suggestions.filter((suggestion) => suggestion.id !== id);
}
