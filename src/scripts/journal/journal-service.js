import { CONTEXT_PINNED_FLAG, MODULE_ID } from "../constants.js";

export const CLAUDE_JOURNAL_FLAG = "claudeJournal";
export const CONVERSATION_LOG_PAGE_NAME = "Conversation Log";
const DEFAULT_MAX_CONTEXT_CHARS = 12_000;

/**
 * @returns {JournalEntry|null}
 */
export function getClaudeJournal() {
  const storedId = game.settings.get(MODULE_ID, "claudeJournalId");
  if (storedId) {
    const stored = game.journal.get(storedId);
    if (stored) return stored;
  }

  return game.journal.find((entry) => entry.getFlag(MODULE_ID, CLAUDE_JOURNAL_FLAG)) ?? null;
}

/**
 * @returns {Promise<JournalEntry>}
 */
export async function ensureClaudeJournal() {
  const existing = getClaudeJournal();
  if (existing) {
    if (!game.settings.get(MODULE_ID, "claudeJournalId")) {
      await game.settings.set(MODULE_ID, "claudeJournalId", existing.id);
    }
    return existing;
  }

  const journal = await JournalEntry.create({
    name: game.i18n.localize("CLAUDE-MOD.Journal.DefaultName"),
    folder: null,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    flags: { [MODULE_ID]: { [CLAUDE_JOURNAL_FLAG]: true } },
  });

  await game.settings.set(MODULE_ID, "claudeJournalId", journal.id);
  ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Journal.Created"));
  return journal;
}

/**
 * @param {JournalEntryPage} page
 * @returns {boolean}
 */
export function isPageContextPinned(page) {
  return Boolean(page?.getFlag(MODULE_ID, CONTEXT_PINNED_FLAG));
}

/**
 * @param {JournalEntry} journal
 * @returns {boolean}
 */
export function isJournalContextPinned(journal) {
  return Boolean(journal?.getFlag(MODULE_ID, CONTEXT_PINNED_FLAG));
}

/**
 * @param {JournalEntryPage} page
 * @returns {Promise<boolean>} New pinned state
 */
export async function togglePageContextPin(page) {
  const pinned = !isPageContextPinned(page);
  if (pinned) await page.setFlag(MODULE_ID, CONTEXT_PINNED_FLAG, true);
  else await page.unsetFlag(MODULE_ID, CONTEXT_PINNED_FLAG);
  return pinned;
}

/**
 * @param {JournalEntry} journal
 * @returns {Promise<boolean>} New pinned state
 */
export async function toggleJournalContextPin(journal) {
  const pinned = !isJournalContextPinned(journal);
  if (pinned) await journal.setFlag(MODULE_ID, CONTEXT_PINNED_FLAG, true);
  else await journal.unsetFlag(MODULE_ID, CONTEXT_PINNED_FLAG);
  return pinned;
}

/**
 * @param {string[]} folderIds
 * @returns {Set<string>}
 */
function expandFolderIds(folderIds) {
  const ids = new Set(folderIds);
  for (const folderId of folderIds) {
    const folder = game.folders.get(folderId);
    if (!folder) continue;
    for (const descendant of folder.descendants ?? []) {
      ids.add(descendant.id);
    }
  }
  return ids;
}

/**
 * @returns {Set<string>} Journal entry IDs included by the current context mode
 */
export function buildModeJournalIdSet() {
  const mode = game.settings.get(MODULE_ID, "journalContextMode") ?? "claudeOnly";
  const claudeJournal = getClaudeJournal();
  const set = new Set();

  if (mode === "claudeOnly") {
    if (claudeJournal) set.add(claudeJournal.id);
    return set;
  }

  if (mode === "all") {
    for (const entry of game.journal.contents) {
      if (entry.testUserPermission(game.user, "OBSERVER")) set.add(entry.id);
    }
    return set;
  }

  const journalIds = game.settings.get(MODULE_ID, "journalContextJournalIds") ?? [];
  const folderIds = game.settings.get(MODULE_ID, "journalContextFolderIds") ?? [];
  const folderSet = expandFolderIds(folderIds);

  for (const id of journalIds) set.add(id);

  for (const entry of game.journal.contents) {
    if (!entry.folder || !folderSet.has(entry.folder.id)) continue;
    if (entry.testUserPermission(game.user, "OBSERVER")) set.add(entry.id);
  }

  return set;
}

/**
 * @param {JournalEntry} journal
 * @returns {boolean}
 */
function journalHasPinnedPage(journal) {
  return journal.pages.some((page) => isPageContextPinned(page));
}

/**
 * @returns {JournalEntry[]}
 */
export function resolveContextJournals() {
  const modeSet = buildModeJournalIdSet();
  const byId = new Map();

  for (const entry of game.journal.contents) {
    if (!entry.testUserPermission(game.user, "OBSERVER")) continue;

    const inMode = modeSet.has(entry.id);
    const journalPinned = isJournalContextPinned(entry);
    const hasPinnedPage = journalHasPinnedPage(entry);

    if (inMode || journalPinned || hasPinnedPage) {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

/**
 * @param {JournalEntryPage} page
 * @param {JournalEntry} journal
 * @returns {boolean}
 */
function shouldExcludePage(page, journal) {
  if (journal !== getClaudeJournal()) return false;
  if (!game.settings.get(MODULE_ID, "journalExcludeConversationLog")) return false;
  return page.name === CONVERSATION_LOG_PAGE_NAME;
}

/**
 * @param {JournalEntry} journal
 * @param {Set<string>} modeSet
 * @returns {JournalEntryPage[]}
 */
export function getPagesForContext(journal, modeSet) {
  const inMode = modeSet.has(journal.id);
  const journalPinned = isJournalContextPinned(journal);
  const pinnedPages = [...journal.pages.contents].filter((page) => isPageContextPinned(page));

  let pages;
  if (pinnedPages.length > 0) {
    pages = pinnedPages;
  } else if (inMode || journalPinned) {
    pages = [...journal.pages.contents];
  } else {
    return [];
  }

  return pages
    .sort((a, b) => a.sort - b.sort)
    .filter((page) => !shouldExcludePage(page, journal));
}

/**
 * @param {string} html
 * @returns {string}
 */
function htmlToPlainText(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

/**
 * @param {JournalEntryPage} page
 * @returns {string}
 */
function extractPagePlainText(page) {
  if (page.type === "text" && page.text?.content) {
    const plain = htmlToPlainText(page.text.content);
    return plain ? `### ${page.name}\n${plain}` : "";
  }

  if (page.type === "image" && page.image?.caption) {
    const caption = page.image.caption.trim();
    return caption ? `### ${page.name}\n[Image] ${caption}` : "";
  }

  return "";
}

/**
 * @param {JournalEntryPage[]} pages
 * @param {number} [maxChars]
 * @returns {string}
 */
export function extractPagesPlainText(pages, maxChars = Infinity) {
  const parts = [];
  for (const page of pages) {
    const chunk = extractPagePlainText(page);
    if (chunk) parts.push(chunk);
  }

  let text = parts.join("\n\n").trim();
  if (text.length > maxChars) {
    text = `${text.slice(0, maxChars)}\n…`;
  }
  return text;
}

/**
 * @returns {Promise<{ entries: Array<{ id: string, name: string, text: string }>, truncated: boolean }>}
 */
export async function collectJournalContext() {
  if (!game.settings.get(MODULE_ID, "journalContextEnabled")) {
    return { entries: [], truncated: false };
  }

  const maxChars = game.settings.get(MODULE_ID, "journalContextMaxChars") ?? DEFAULT_MAX_CONTEXT_CHARS;
  const modeSet = buildModeJournalIdSet();
  const journals = resolveContextJournals();

  /** @type {Array<{ id: string, name: string, text: string }>} */
  const entries = [];
  let remaining = maxChars;
  let truncated = false;

  for (const journal of journals) {
    if (remaining <= 0) {
      truncated = true;
      break;
    }

    const pages = getPagesForContext(journal, modeSet);
    if (!pages.length) continue;

    const text = extractPagesPlainText(pages, remaining);
    if (!text) continue;

    if (text.length >= remaining) truncated = true;

    entries.push({ id: journal.id, name: journal.name, text });
    remaining -= text.length + 2;
  }

  return { entries, truncated };
}

/**
 * @param {string} prompt
 * @param {string} response
 * @returns {Promise<JournalEntry|null>}
 */
export async function appendConversationLog(prompt, response) {
  if (!game.settings.get(MODULE_ID, "journalWriteEnabled")) return null;
  if (!game.user.isGM) return null;

  const journal = await ensureClaudeJournal();
  const page = journal.pages.find((p) => p.name === CONVERSATION_LOG_PAGE_NAME);
  const block = formatLogBlock(prompt, response);

  if (!page) {
    await journal.createEmbeddedDocuments("JournalEntryPage", [
      {
        name: CONVERSATION_LOG_PAGE_NAME,
        type: "text",
        text: {
          content: block,
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
      },
    ]);
    return journal;
  }

  const content = `${page.text.content}${block}`;
  await page.update({ "text.content": content });
  return journal;
}

/**
 * @param {string} prompt
 * @param {string} response
 * @returns {string}
 */
function formatLogBlock(prompt, response) {
  const timestamp = new Date().toLocaleString();
  const q = foundry.utils.escapeHTML(prompt);
  const a = foundry.utils.escapeHTML(response).replace(/\n/g, "<br>");
  return `<hr><h3>${foundry.utils.escapeHTML(timestamp)}</h3><p><strong>Q:</strong> ${q}</p><p><strong>A:</strong> ${a}</p>`;
}

/**
 * @returns {Promise<void>}
 */
export async function openClaudeJournal() {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.GmOnly"));
    return;
  }

  const journal = await ensureClaudeJournal();
  journal.sheet?.render(true);
}
