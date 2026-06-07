import { ClaudeService } from "../api/claude-service.js";
import {
  createSuggestionsFromRaw,
  parseAssistantResponse,
  removeSuggestion,
} from "../api/suggestion-parser.js";
import { getWorldSummary } from "../api/world-summary-service.js";
import {
  appendMessage,
  clearMessages,
  messagesFromHistory,
  shouldScrollToBottom,
} from "../chat/message-state.js";
import { formatPromptChatContent, formatResponseChatContent } from "../chat/chat-format.js";
import {
  createAssistantJournal,
  createAssistantJournalFromSuggestion,
  getQuickCreateTypes,
  getRecentlyCreated,
  openAssistantDocument,
  openKnowledgeBase,
  openPlayMaterials,
  promptForDocumentName,
} from "../journal/assistant-content-service.js";
import { MODULE_ID } from "../constants.js";
import { hasApiKey } from "../settings/api-key.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CampaignAssistantApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {CampaignAssistantApplication|null} */
  static #activeInstance = null;

  static DEFAULT_OPTIONS = {
    id: "claude-campaign-assistant-app",
    classes: ["claude-mod", "campaign-assistant"],
    position: {
      width: 960,
      height: 720,
    },
    window: {
      resizable: true,
      title: "CLAUDE-MOD.CampaignAssistant.WindowTitle",
    },
    actions: {
      sendMessage: CampaignAssistantApplication.#onSendMessage,
      newConversation: CampaignAssistantApplication.#onNewConversation,
      toggleSidebar: CampaignAssistantApplication.#onToggleSidebar,
      refreshWorldSummary: CampaignAssistantApplication.#onRefreshWorldSummary,
      quickCreate: CampaignAssistantApplication.#onQuickCreate,
      openRecent: CampaignAssistantApplication.#onOpenRecent,
      openKnowledgeBase: CampaignAssistantApplication.#onOpenKnowledgeBase,
      openPlayMaterials: CampaignAssistantApplication.#onOpenPlayMaterials,
      acceptSuggestion: CampaignAssistantApplication.#onAcceptSuggestion,
      dismissSuggestion: CampaignAssistantApplication.#onDismissSuggestion,
      acceptAllSuggestions: CampaignAssistantApplication.#onAcceptAllSuggestions,
      dismissAllSuggestions: CampaignAssistantApplication.#onDismissAllSuggestions,
    },
  };

  static PARTS = {
    content: {
      template: "modules/claude-mod/templates/campaign-assistant.hbs",
      scrollable: [".claude-mod-chat-transcript", ".claude-mod-world-summary-body"],
    },
  };

  constructor(options = {}) {
    super(options);
    CampaignAssistantApplication.#activeInstance = this;
    /** @type {Array<{ id: string, role: "user"|"assistant", content: string, timestamp: number, contentHtml?: string }>} */
    this.messages = messagesFromHistory(ClaudeService.getInstance().getHistory());
    this.loading = false;
    this.sidebarOpen = true;
    /** @type {Array<{ id: string, type: string, title: string, tags: string[], tagLabels: string, content: string, icon: string, snippet: string }>} */
    this.suggestions = [];
    /** @type {{ text: string, truncated: boolean, journalCount: number }} */
    this.worldSummary = { text: "", truncated: false, journalCount: 0 };
    this.worldSummaryLoaded = false;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    if (!this.worldSummaryLoaded) {
      await this.loadWorldSummary();
    }

    context.messages = this.messages.map((message) => ({
      ...message,
      contentHtml: foundry.utils.escapeHTML(message.content).replace(/\n/g, "<br>"),
    }));
    context.loading = this.loading;
    context.hasApiKey = hasApiKey();
    context.sidebarOpen = this.sidebarOpen;
    context.suggestions = this.suggestions.map((suggestion) => ({
      ...suggestion,
      snippet:
        suggestion.content.length > 120
          ? `${suggestion.content.slice(0, 120).trimEnd()}…`
          : suggestion.content,
    }));
    context.suggestionCount = this.suggestions.length;
    context.worldSummary = this.worldSummary;
    context.recentlyCreated = getRecentlyCreated(5);
    context.quickCreateTypes = getQuickCreateTypes().map((type) => ({
      ...type,
      label: game.i18n.localize(type.labelKey),
    }));
    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.bindChatInput();
    this.scrollChatToBottom();
  }

  static async open() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.GmOnly"));
      return;
    }

    const existing = CampaignAssistantApplication.#activeInstance;
    if (existing?.rendered) {
      existing.bringToFront?.();
      await existing.render({ force: true });
      return;
    }

    const app = new CampaignAssistantApplication();
    await app.render({ force: true });
  }

  async loadWorldSummary() {
    try {
      this.worldSummary = await getWorldSummary();
      this.worldSummaryLoaded = true;
    } catch (error) {
      console.warn(`${MODULE_ID} | Failed to load world summary`, error);
      this.worldSummary = { text: "", truncated: false, journalCount: 0 };
    }
  }

  bindChatInput() {
    const textarea = this.element?.querySelector('.claude-mod-chat-input textarea[name="message"]');
    if (!textarea || textarea.dataset.bound === "true") return;

    textarea.dataset.bound = "true";
    textarea.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      void this.submitMessage(textarea);
    });
  }

  scrollChatToBottom(force = true) {
    const transcript = this.element?.querySelector("[data-chat-transcript]");
    if (!transcript) return;

    if (
      force ||
      shouldScrollToBottom({
        scrollTop: transcript.scrollTop,
        scrollHeight: transcript.scrollHeight,
        clientHeight: transcript.clientHeight,
      })
    ) {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }

  async submitMessage(input) {
    const message = input?.value?.trim() ?? "";
    if (!message || this.loading) return;

    input.value = "";
    this.messages = appendMessage(this.messages, "user", message);
    this.loading = true;
    await this.render({ force: true });
    this.scrollChatToBottom();

    try {
      const suggestDocuments =
        game.settings.get(MODULE_ID, "suggestionsEnabled") &&
        ClaudeService.getInstance().getHistory().length === 0;
      const result = await ClaudeService.getInstance().sendMessage(message, { suggestDocuments });
      const parsed = parseAssistantResponse(result.text);
      this.messages = appendMessage(this.messages, "assistant", parsed.text);

      if (parsed.suggestions.length) {
        this.suggestions = [
          ...this.suggestions,
          ...createSuggestionsFromRaw(parsed.suggestions),
        ];
      }

      if (game.settings.get(MODULE_ID, "echoToChat")) {
        await postResponseToChat(message, result.text);
      }
    } catch (error) {
      ui.notifications.error(error.message, { console: false });
      this.messages = appendMessage(
        this.messages,
        "assistant",
        game.i18n.format("CLAUDE-MOD.CampaignAssistant.ErrorMessage", { error: error.message }),
      );
    } finally {
      this.loading = false;
      await this.render({ force: true });
      this.scrollChatToBottom();
    }
  }

  /** @this {CampaignAssistantApplication} */
  static async #onSendMessage(event) {
    event.preventDefault();
    const input = this.element?.querySelector('.claude-mod-chat-input textarea[name="message"]');
    await this.submitMessage(input);
  }

  /** @this {CampaignAssistantApplication} */
  static async #onNewConversation(event) {
    event.preventDefault();
    ClaudeService.getInstance().resetHistory();
    this.messages = clearMessages();
    this.suggestions = [];
    this.worldSummaryLoaded = false;
    await this.render({ force: true });
  }

  /** @this {CampaignAssistantApplication} */
  static async #onToggleSidebar(event) {
    event.preventDefault();
    this.sidebarOpen = !this.sidebarOpen;
    await this.render({ force: true });
  }

  /** @this {CampaignAssistantApplication} */
  static async #onRefreshWorldSummary(event) {
    event.preventDefault();
    this.worldSummaryLoaded = false;
    await this.loadWorldSummary();
    await this.render({ force: true });
    ui.notifications.info(game.i18n.localize("CLAUDE-MOD.CampaignAssistant.WorldRefreshed"));
  }

  /** @this {CampaignAssistantApplication} */
  static async #onQuickCreate(event) {
    event.preventDefault();
    const button = event.target.closest("[data-create-type]");
    const type = button?.dataset.createType;
    if (!type) return;

    const typeDef = getQuickCreateTypes().find((entry) => entry.id === type);
    const title = game.i18n.format("CLAUDE-MOD.CampaignAssistant.QuickCreateTitle", {
      type: game.i18n.localize(typeDef?.labelKey ?? "CLAUDE-MOD.CampaignAssistant.QuickCreate"),
    });
    const name = await promptForDocumentName(title);
    if (!name) return;

    try {
      const journal = await createAssistantJournal(type, name);
      ui.notifications.info(
        game.i18n.format("CLAUDE-MOD.CampaignAssistant.Created", { name: journal.name }),
      );
      journal.sheet?.render(true);
      await this.render({ force: true });
    } catch (error) {
      ui.notifications.error(error.message, { console: false });
    }
  }

  /** @this {CampaignAssistantApplication} */
  static async #onOpenRecent(event) {
    event.preventDefault();
    const row = event.target.closest("[data-document-id]");
    if (!row) return;

    await openAssistantDocument(
      row.dataset.documentType,
      row.dataset.documentId,
      row.dataset.parentId,
    );
  }

  /** @this {CampaignAssistantApplication} */
  static async #onOpenKnowledgeBase(event) {
    event.preventDefault();
    await openKnowledgeBase();
  }

  /** @this {CampaignAssistantApplication} */
  static async #onOpenPlayMaterials(event) {
    event.preventDefault();
    await openPlayMaterials();
  }

  /** @this {CampaignAssistantApplication} */
  static async #onAcceptSuggestion(event) {
    event.preventDefault();
    const card = event.target.closest("[data-suggestion-id]");
    const id = card?.dataset.suggestionId;
    if (!id) return;

    const suggestion = this.suggestions.find((entry) => entry.id === id);
    if (!suggestion) return;

    try {
      const journal = await createAssistantJournalFromSuggestion(suggestion);
      this.suggestions = removeSuggestion(this.suggestions, id);
      ui.notifications.info(
        game.i18n.format("CLAUDE-MOD.CampaignAssistant.SuggestionAccepted", { name: journal.name }),
      );
      journal.sheet?.render(true);
      await this.render({ force: true });
    } catch (error) {
      ui.notifications.error(error.message, { console: false });
    }
  }

  /** @this {CampaignAssistantApplication} */
  static async #onDismissSuggestion(event) {
    event.preventDefault();
    const card = event.target.closest("[data-suggestion-id]");
    const id = card?.dataset.suggestionId;
    if (!id) return;

    this.suggestions = removeSuggestion(this.suggestions, id);
    await this.render({ force: true });
  }

  /** @this {CampaignAssistantApplication} */
  static async #onAcceptAllSuggestions(event) {
    event.preventDefault();
    if (!this.suggestions.length) return;

    const pending = [...this.suggestions];
    this.suggestions = [];
    let created = 0;

    for (const suggestion of pending) {
      try {
        await createAssistantJournalFromSuggestion(suggestion);
        created += 1;
      } catch (error) {
        console.warn(`${MODULE_ID} | Failed to accept suggestion`, error);
      }
    }

    if (created > 0) {
      ui.notifications.info(
        game.i18n.format("CLAUDE-MOD.CampaignAssistant.SuggestionsAcceptedAll", { count: created }),
      );
    }

    await this.render({ force: true });
  }

  /** @this {CampaignAssistantApplication} */
  static async #onDismissAllSuggestions(event) {
    event.preventDefault();
    this.suggestions = [];
    await this.render({ force: true });
  }
}

/**
 * @param {string} prompt
 * @param {string} response
 */
async function postResponseToChat(prompt, response) {
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ alias: game.i18n.localize("CLAUDE-MOD.Chat.FromClaude") }),
    content: `${formatPromptChatContent(prompt)}${formatResponseChatContent(response)}`,
    whisper: [game.user.id],
  });
}
