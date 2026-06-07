import { ASSISTANT_CREATE_TYPE_FLAG, ASSISTANT_CREATED_FLAG, MODULE_ID } from "../constants.js";

/** @type {const} */
export const QUICK_CREATE_TYPE_DEFS = [
  { id: "session", icon: "fa-calendar-days", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateSession" },
  { id: "npc", icon: "fa-users", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateNpc" },
  { id: "location", icon: "fa-location-dot", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateLocation" },
  { id: "storyArc", icon: "fa-book", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateStoryArc" },
  { id: "encounter", icon: "fa-dice-d20", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateEncounter" },
  { id: "playerCharacter", icon: "fa-user", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreatePlayerCharacter" },
  { id: "lore", icon: "fa-bookmark", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateLore" },
  { id: "sceneOutline", icon: "fa-clapperboard", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateSceneOutline" },
  { id: "secretsClues", icon: "fa-eye", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateSecretsClues" },
  { id: "magicItem", icon: "fa-wand-magic-sparkles", labelKey: "CLAUDE-MOD.CampaignAssistant.QuickCreateMagicItem" },
];

/** @type {Record<string, { icon: string }>} */
const TYPE_PRESENTATION = Object.fromEntries(
  QUICK_CREATE_TYPE_DEFS.map((type) => [type.id, { icon: type.icon }]),
);

/**
 * @returns {typeof QUICK_CREATE_TYPE_DEFS}
 */
export function getQuickCreateTypes() {
  return QUICK_CREATE_TYPE_DEFS;
}

/**
 * @param {number} timestamp
 * @param {string} [locale]
 */
export function formatRecentItemDate(timestamp, locale = "en-US") {
  return new Date(timestamp).toLocaleDateString(locale, { month: "short", day: "numeric" });
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * @param {string} type
 * @param {string} name
 * @returns {string}
 */
export function buildPageTemplate(type, name) {
  const safeName = escapeHtml(name);
  const sections = {
    session: [
      "<h2>Session Notes</h2>",
      `<p><strong>Session:</strong> ${safeName}</p>`,
      "<h3>Recap</h3><p></p>",
      "<h3>Scenes</h3><p></p>",
      "<h3>Outstanding Hooks</h3><p></p>",
    ],
    npc: [
      "<h2>NPC</h2>",
      `<p><strong>Name:</strong> ${safeName}</p>`,
      "<h3>Appearance</h3><p></p>",
      "<h3>Personality</h3><p></p>",
      "<h3>Goals</h3><p></p>",
      "<h3>Secrets</h3><p></p>",
    ],
    location: [
      "<h2>Location</h2>",
      `<p><strong>Name:</strong> ${safeName}</p>`,
      "<h3>Description</h3><p></p>",
      "<h3>Notable Features</h3><p></p>",
      "<h3>Secrets</h3><p></p>",
    ],
    storyArc: [
      "<h2>Story Arc</h2>",
      `<p><strong>Arc:</strong> ${safeName}</p>`,
      "<h3>Theme</h3><p></p>",
      "<h3>Key Beats</h3><p></p>",
      "<h3>Climax</h3><p></p>",
    ],
    encounter: [
      "<h2>Encounter</h2>",
      `<p><strong>Encounter:</strong> ${safeName}</p>`,
      "<h3>Setup</h3><p></p>",
      "<h3>Creatures / Challenges</h3><p></p>",
      "<h3>Tactics</h3><p></p>",
      "<h3>Rewards</h3><p></p>",
    ],
    playerCharacter: [
      "<h2>Player Character</h2>",
      `<p><strong>Name:</strong> ${safeName}</p>`,
      "<h3>Concept</h3><p></p>",
      "<h3>Goals</h3><p></p>",
      "<h3>Connections</h3><p></p>",
    ],
    lore: [
      "<h2>Lore</h2>",
      `<p><strong>Topic:</strong> ${safeName}</p>`,
      "<h3>Summary</h3><p></p>",
      "<h3>Details</h3><p></p>",
    ],
    sceneOutline: [
      "<h2>Scene Outline</h2>",
      `<p><strong>Scene:</strong> ${safeName}</p>`,
      "<h3>Goal</h3><p></p>",
      "<h3>Opening</h3><p></p>",
      "<h3>Developments</h3><p></p>",
      "<h3>Outcome</h3><p></p>",
    ],
    secretsClues: [
      "<h2>Secrets &amp; Clues</h2>",
      `<p><strong>Topic:</strong> ${safeName}</p>`,
      "<h3>Secrets</h3><ul><li></li></ul>",
      "<h3>Clues</h3><ul><li></li></ul>",
    ],
    magicItem: [
      "<h2>Magic Item</h2>",
      `<p><strong>Item:</strong> ${safeName}</p>`,
      "<h3>Appearance</h3><p></p>",
      "<h3>Properties</h3><p></p>",
      "<h3>History</h3><p></p>",
    ],
  };

  const body = sections[type] ?? [`<h2>${safeName}</h2>`, "<p></p>"];
  return body.join("");
}

/**
 * @param {Array<{ timestamp: number }>} items
 * @param {number} [limit]
 */
export function sortRecentItems(items, limit = 5) {
  return [...items].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * @param {string} type
 * @returns {{ icon: string }}
 */
function getTypePresentation(type) {
  return TYPE_PRESENTATION[type] ?? { icon: "fa-bookmark" };
}

/**
 * @param {number} [limit]
 * @returns {Array<{
 *   id: string,
 *   documentId: string,
 *   documentType: "JournalEntry"|"JournalEntryPage",
 *   parentId?: string,
 *   title: string,
 *   type: string,
 *   icon: string,
 *   timestamp: number,
 *   dateLabel: string
 * }>}
 */
export function getRecentlyCreated(limit = 5) {
  /** @type {Array<Record<string, unknown>>} */
  const items = [];

  for (const journal of game.journal.contents) {
    const journalTimestamp = journal.getFlag(MODULE_ID, ASSISTANT_CREATED_FLAG);
    if (journalTimestamp) {
      const type = journal.getFlag(MODULE_ID, ASSISTANT_CREATE_TYPE_FLAG) ?? "lore";
      items.push({
        id: `journal:${journal.id}`,
        documentId: journal.id,
        documentType: "JournalEntry",
        title: journal.name,
        type,
        icon: getTypePresentation(type).icon,
        timestamp: Number(journalTimestamp),
      });
    }

    for (const page of journal.pages.contents) {
      const pageTimestamp = page.getFlag(MODULE_ID, ASSISTANT_CREATED_FLAG);
      if (!pageTimestamp) continue;

      const type = page.getFlag(MODULE_ID, ASSISTANT_CREATE_TYPE_FLAG) ?? "lore";
      items.push({
        id: `page:${page.id}`,
        documentId: page.id,
        documentType: "JournalEntryPage",
        parentId: journal.id,
        title: page.name,
        type,
        icon: getTypePresentation(type).icon,
        timestamp: Number(pageTimestamp),
      });
    }
  }

  return sortRecentItems(items, limit).map((item) => ({
    ...item,
    dateLabel: formatRecentItemDate(item.timestamp),
  }));
}

/**
 * @param {string} type
 * @param {string} name
 * @returns {Promise<JournalEntry>}
 */
export async function createAssistantJournal(type, name) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error(game.i18n.localize("CLAUDE-MOD.CampaignAssistant.NameRequired"));
  }

  const timestamp = Date.now();
  const pageContent = buildPageTemplate(type, trimmed);
  const typeDef = QUICK_CREATE_TYPE_DEFS.find((entry) => entry.id === type);
  const pageName = typeDef
    ? game.i18n.localize(typeDef.labelKey)
    : game.i18n.localize("CLAUDE-MOD.CampaignAssistant.QuickCreateDefaultPage");

  const journal = await JournalEntry.create({
    name: trimmed,
    folder: null,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    flags: {
      [MODULE_ID]: {
        [ASSISTANT_CREATED_FLAG]: timestamp,
        [ASSISTANT_CREATE_TYPE_FLAG]: type,
      },
    },
    pages: [
      {
        name: pageName,
        type: "text",
        text: {
          content: pageContent,
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
      },
    ],
  });

  return journal;
}

/**
 * @param {string} content
 * @returns {string}
 */
export function formatSuggestionContent(content) {
  const trimmed = String(content ?? "").trim();
  if (!trimmed) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/**
 * @param {{ type: string, title: string, content?: string }} suggestion
 * @returns {Promise<JournalEntry>}
 */
export async function createAssistantJournalFromSuggestion(suggestion) {
  const trimmed = suggestion.title.trim();
  if (!trimmed) {
    throw new Error(game.i18n.localize("CLAUDE-MOD.CampaignAssistant.NameRequired"));
  }

  const timestamp = Date.now();
  const pageContent = formatSuggestionContent(suggestion.content);
  const typeDef = QUICK_CREATE_TYPE_DEFS.find((entry) => entry.id === suggestion.type);
  const pageName = typeDef
    ? game.i18n.localize(typeDef.labelKey)
    : game.i18n.localize("CLAUDE-MOD.CampaignAssistant.QuickCreateDefaultPage");

  const journal = await JournalEntry.create({
    name: trimmed,
    folder: null,
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    flags: {
      [MODULE_ID]: {
        [ASSISTANT_CREATED_FLAG]: timestamp,
        [ASSISTANT_CREATE_TYPE_FLAG]: suggestion.type,
      },
    },
    pages: [
      {
        name: pageName,
        type: "text",
        text: {
          content: pageContent,
          format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
        },
      },
    ],
  });

  return journal;
}

/**
 * @param {string} documentType
 * @param {string} documentId
 * @param {string} [parentId]
 */
export async function openAssistantDocument(documentType, documentId, parentId) {
  if (documentType === "JournalEntry") {
    const journal = game.journal.get(documentId);
    journal?.sheet?.render(true);
    return;
  }

  if (documentType === "JournalEntryPage") {
    const journal = game.journal.get(parentId);
    const page = journal?.pages.get(documentId);
    if (journal && page) {
      await journal.sheet?.render(true);
      journal.sheet?.gotoPage?.(page);
    }
  }
}

/**
 * @returns {Promise<void>}
 */
export async function openKnowledgeBase() {
  await game.journal.directory?.render(true);
}

/**
 * @returns {Promise<void>}
 */
export async function openPlayMaterials() {
  if (game.actors?.directory) {
    await game.actors.directory.render(true);
    return;
  }

  await game.scenes?.directory?.render(true);
}

/**
 * @param {string} title
 * @param {string} [defaultName]
 * @returns {Promise<string|null>}
 */
export function promptForDocumentName(title, defaultName = "") {
  return new Promise((resolve) => {
    const dialog = new Dialog(
      {
        title,
        content: `<form class="claude-mod-quick-create-dialog">
          <div class="form-group">
            <label>${game.i18n.localize("CLAUDE-MOD.CampaignAssistant.NameLabel")}</label>
            <input type="text" name="name" value="${foundry.utils.escapeHTML(defaultName)}" autofocus>
          </div>
        </form>`,
        buttons: {
          create: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("CLAUDE-MOD.CampaignAssistant.Create"),
            callback: (html) => resolve(html.find('[name="name"]').val()?.trim() ?? ""),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize("CLAUDE-MOD.Cancel"),
            callback: () => resolve(null),
          },
        },
        default: "create",
        close: () => resolve(null),
      },
      { width: 360 },
    );

    dialog.render(true);
  });
}
