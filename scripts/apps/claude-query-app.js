import { ClaudeService } from "../api/claude-service.js";
import { hasApiKey } from "../settings/api-key.js";
import { MODULE_ID } from "../constants.js";
import { openClaudeJournal } from "../journal/journal-service.js";
import { formatPromptChatContent, formatResponseChatContent } from "../chat/chat-format.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ClaudeQueryApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  /** @type {ClaudeQueryApplication|null} */
  static #activeInstance = null;

  static DEFAULT_OPTIONS = {
    id: "claude-query-app",
    classes: ["claude-mod", "query-app"],
    position: {
      width: 640,
      height: 520,
    },
    window: {
      resizable: true,
      title: "CLAUDE-MOD.QueryWindowTitle",
    },
    actions: {
      sendQuery: ClaudeQueryApplication.#onSendQuery,
      clearPrompt: ClaudeQueryApplication.#onClearPrompt,
      newConversation: ClaudeQueryApplication.#onNewConversation,
      openJournal: ClaudeQueryApplication.#onOpenJournal,
    },
  };

  static PARTS = {
    content: {
      template: "modules/claude-mod/templates/claude-query.hbs",
    },
  };

  constructor(options = {}) {
    super(options);
    ClaudeQueryApplication.#activeInstance = this;
    this.prompt = "";
    this.response = "";
    this.status = game.i18n.localize("CLAUDE-MOD.Status.Ready");
    this.loading = false;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.prompt = this.prompt;
    context.response = this.response;
    context.status = this.status;
    context.loading = this.loading;
    context.hasApiKey = hasApiKey();
    return context;
  }

  static async open() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.GmOnly"));
      return;
    }

    const existing = ClaudeQueryApplication.#activeInstance;
    if (existing?.rendered) {
      existing.bringToFront?.();
      await existing.render({ force: true });
      return;
    }

    const app = new ClaudeQueryApplication();
    await app.render({ force: true });
  }

  /** @this {ClaudeQueryApplication} */
  static async #onSendQuery(event) {
    event.preventDefault();
    const promptInput = this.element?.querySelector('[name="prompt"]');
    const prompt = promptInput?.value?.trim() ?? "";
    if (!prompt) {
      this.status = game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt");
      await this.render({ force: true });
      return;
    }

    this.prompt = prompt;
    this.loading = true;
    this.status = game.i18n.localize("CLAUDE-MOD.Status.Loading");
    await this.render({ force: true });

    try {
      const result = await ClaudeService.getInstance().sendMessage(prompt);
      this.response = result.text;
      this.status = game.i18n.format("CLAUDE-MOD.Status.Success", { model: result.model });

      if (game.settings.get(MODULE_ID, "echoToChat")) {
        await postResponseToChat(prompt, result.text);
      }
    } catch (error) {
      this.status = error.message;
      ui.notifications.error(error.message, { console: false });
    } finally {
      this.loading = false;
      await this.render({ force: true });
    }
  }

  /** @this {ClaudeQueryApplication} */
  static async #onClearPrompt(event) {
    event.preventDefault();
    this.prompt = "";
    await this.render({ force: true });
  }

  /** @this {ClaudeQueryApplication} */
  static async #onNewConversation(event) {
    event.preventDefault();
    ClaudeService.getInstance().resetHistory();
    this.response = "";
    this.status = game.i18n.localize("CLAUDE-MOD.Status.ConversationReset");
    await this.render({ force: true });
  }

  /** @this {ClaudeQueryApplication} */
  static async #onOpenJournal(event) {
    event.preventDefault();
    await openClaudeJournal();
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
