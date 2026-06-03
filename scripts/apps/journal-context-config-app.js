import { JOURNAL_CONTEXT_MODE_CHOICES, JOURNAL_CONTEXT_MODE_DEFAULT, MODULE_ID } from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class JournalContextConfigApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "claude-mod-journal-context-config",
    classes: ["claude-mod", "journal-context-config"],
    tag: "form",
    position: {
      width: 520,
      height: 640,
    },
    window: {
      title: "CLAUDE-MOD.Settings.JournalContextMenuName",
      resizable: true,
    },
    form: {
      handler: JournalContextConfigApplication.#onSubmitForm,
      closeOnSubmit: true,
      submitOnChange: false,
    },
  };

  static PARTS = {
    content: {
      template: "modules/claude-mod/templates/journal-context-config.hbs",
      scrollable: [""],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const mode = game.settings.get(MODULE_ID, "journalContextMode") ?? JOURNAL_CONTEXT_MODE_DEFAULT;
    const selectedJournalIds = new Set(game.settings.get(MODULE_ID, "journalContextJournalIds") ?? []);
    const selectedFolderIds = new Set(game.settings.get(MODULE_ID, "journalContextFolderIds") ?? []);

    context.modes = Object.entries(JOURNAL_CONTEXT_MODE_CHOICES).map(([value, labelKey]) => ({
      value,
      label: game.i18n.localize(labelKey),
      selected: mode === value,
    }));

    context.folders = game.folders
      .filter((folder) => folder.type === "JournalEntry")
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        checked: selectedFolderIds.has(folder.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    const journalsByFolder = new Map();
    const unsorted = [];

    for (const journal of game.journal.contents) {
      if (!journal.testUserPermission(game.user, "OBSERVER")) continue;

      const entry = {
        id: journal.id,
        name: journal.name,
        checked: selectedJournalIds.has(journal.id),
      };

      if (journal.folder) {
        const list = journalsByFolder.get(journal.folder.id) ?? [];
        list.push(entry);
        journalsByFolder.set(journal.folder.id, list);
      } else {
        unsorted.push(entry);
      }
    }

    context.journalGroups = context.folders
      .map((folder) => ({
        folderId: folder.id,
        folderName: folder.name,
        journals: (journalsByFolder.get(folder.id) ?? []).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        ),
      }))
      .filter((group) => group.journals.length > 0);

    context.unsortedJournals = unsorted.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

    context.isCustomMode = mode === "custom";
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const select = this.element?.querySelector("#journal-context-mode");
    const fieldset = this.element?.querySelector(".claude-mod-journal-context-custom");
    if (!select || !fieldset) return;

    const toggle = () => {
      fieldset.disabled = select.value !== "custom";
    };
    select.addEventListener("change", toggle);
  }

  /**
   * @this {JournalContextConfigApplication}
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #onSubmitForm(event, form, formData) {
    const data = formData.object;
    const mode = data.journalContextMode ?? JOURNAL_CONTEXT_MODE_DEFAULT;

    const journalIds = JournalContextConfigApplication.#collectCheckedIds(form, "journalIds");
    const folderIds = JournalContextConfigApplication.#collectCheckedIds(form, "folderIds");

    await game.settings.set(MODULE_ID, "journalContextMode", mode);
    await game.settings.set(MODULE_ID, "journalContextJournalIds", journalIds);
    await game.settings.set(MODULE_ID, "journalContextFolderIds", folderIds);

    ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Settings.JournalContextSaved"));
  }

  /**
   * @param {HTMLFormElement} form
   * @param {string} name
   * @returns {string[]}
   */
  static #collectCheckedIds(form, name) {
    return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
  }
}

/**
 * Register journal context settings and configuration menu.
 */
export function registerJournalContextSettings() {
  game.settings.register(MODULE_ID, "journalContextMode", {
    name: "CLAUDE-MOD.Settings.JournalContextMode",
    hint: "CLAUDE-MOD.Settings.JournalContextModeHint",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    choices: JOURNAL_CONTEXT_MODE_CHOICES,
    default: JOURNAL_CONTEXT_MODE_DEFAULT,
  });

  game.settings.register(MODULE_ID, "journalContextJournalIds", {
    scope: "world",
    config: false,
    restricted: true,
    type: Array,
    default: [],
  });

  game.settings.register(MODULE_ID, "journalContextFolderIds", {
    scope: "world",
    config: false,
    restricted: true,
    type: Array,
    default: [],
  });

  game.settings.register(MODULE_ID, "journalExcludeConversationLog", {
    name: "CLAUDE-MOD.Settings.JournalExcludeConversationLog",
    hint: "CLAUDE-MOD.Settings.JournalExcludeConversationLogHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "journalReadOthers", {
    scope: "world",
    config: false,
    restricted: true,
    type: Boolean,
    default: false,
  });

  game.settings.registerMenu(MODULE_ID, "journalContextConfig", {
    name: "CLAUDE-MOD.Settings.JournalContextMenuName",
    label: "CLAUDE-MOD.Settings.JournalContextMenuLabel",
    hint: "CLAUDE-MOD.Settings.JournalContextMenuHint",
    icon: "fa-solid fa-book-open",
    type: JournalContextConfigApplication,
    restricted: true,
  });
}
