import {
  isJournalContextPinned,
  isPageContextPinned,
  toggleJournalContextPin,
  togglePageContextPin,
} from "./journal-service.js";

/**
 * @param {ApplicationV2} application
 * @param {ApplicationHeaderControlsEntry[]} controls
 */
function addPageContextPinControl(application, controls) {
  if (!game.user.isGM) return;

  const page = application.document;
  if (page?.documentName !== "JournalEntryPage") return;

  const pinned = isPageContextPinned(page);
  controls.push({
    icon: pinned ? "fa-solid fa-thumbtack" : "fa-regular fa-thumbtack",
    label: pinned
      ? game.i18n.localize("CLAUDE-MOD.Journal.UnpinPageContext")
      : game.i18n.localize("CLAUDE-MOD.Journal.PinPageContext"),
    onClick: async () => {
      const nowPinned = await togglePageContextPin(page);
      ui.notifications.info(
        nowPinned
          ? game.i18n.localize("CLAUDE-MOD.Journal.PagePinned")
          : game.i18n.localize("CLAUDE-MOD.Journal.PageUnpinned"),
      );
      await application.render({ force: true });
    },
  });
}

/**
 * @param {ApplicationV2} application
 * @param {ApplicationHeaderControlsEntry[]} controls
 */
function addJournalContextPinControl(application, controls) {
  if (!game.user.isGM) return;

  const journal = application.document;
  if (journal?.documentName !== "JournalEntry") return;

  const pinned = isJournalContextPinned(journal);
  controls.push({
    icon: pinned ? "fa-solid fa-thumbtack" : "fa-regular fa-thumbtack",
    label: pinned
      ? game.i18n.localize("CLAUDE-MOD.Journal.UnpinJournalContext")
      : game.i18n.localize("CLAUDE-MOD.Journal.PinJournalContext"),
    onClick: async () => {
      const nowPinned = await toggleJournalContextPin(journal);
      ui.notifications.info(
        nowPinned
          ? game.i18n.localize("CLAUDE-MOD.Journal.JournalPinned")
          : game.i18n.localize("CLAUDE-MOD.Journal.JournalUnpinned"),
      );
      await application.render({ force: true });
    },
  });
}

export function registerJournalSheetHooks() {
  const pageHooks = [
    "getHeaderControlsJournalEntryPageHTMLSheet",
    "getHeaderControlsJournalEntryPageMarkdownSheet",
    "getHeaderControlsJournalEntryPageHandlebarsSheet",
  ];

  for (const hookName of pageHooks) {
    Hooks.on(hookName, addPageContextPinControl);
  }

  Hooks.on("getHeaderControlsJournalEntrySheet", addJournalContextPinControl);
}
