import { ANTHROPIC_API_URL, ANTHROPIC_VERSION, MODULE_ID } from "../constants.js";
import { getApiKey } from "../settings/api-key.js";
import { buildJournalSystemSection } from "./context-builder.js";
import { appendConversationLog } from "../journal/journal-service.js";
import { buildSuggestionsSystemInstruction } from "./suggestion-parser.js";

export class ClaudeService {
  static #instance = null;

  /** @type {Array<{ role: string, content: string }>} */
  #history = [];

  /** Cached journal block for the current conversation (cleared on reset). */
  #sessionJournalSystem = "";

  /** Whether to ask Claude for structured document suggestions this conversation. */
  #sessionSuggestDocuments = false;

  static getInstance() {
    if (!this.#instance) this.#instance = new ClaudeService();
    return this.#instance;
  }

  resetHistory() {
    this.#history = [];
    this.#sessionJournalSystem = "";
    this.#sessionSuggestDocuments = false;
  }

  /**
   * @returns {Array<{ role: string, content: string }>}
   */
  getHistory() {
    return this.#history.map((entry) => ({ ...entry }));
  }

  /**
   * @param {string} userText
   * @param {{ resetHistory?: boolean, suggestDocuments?: boolean }} [options]
   * @returns {Promise<{ text: string, model: string, usage?: object }>}
   */
  async sendMessage(userText, { resetHistory = false, suggestDocuments = false } = {}) {
    if (resetHistory) this.resetHistory();

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.NoApiKey"));
    }

    const trimmed = userText.trim();
    if (!trimmed) {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
    }

    if (this.#history.length === 0) {
      const { systemSection } = await buildJournalSystemSection();
      this.#sessionJournalSystem = systemSection;
      this.#sessionSuggestDocuments = Boolean(suggestDocuments);
    }

    this.#history.push({ role: "user", content: trimmed });
    this.#trimHistory();

    const system = this.#composeSystem();
    /** @type {Record<string, unknown>} */
    const body = {
      model: game.settings.get(MODULE_ID, "model"),
      max_tokens: game.settings.get(MODULE_ID, "maxTokens"),
      messages: this.#history,
    };

    if (system) body.system = system;

    const temperature = game.settings.get(MODULE_ID, "temperature");
    if (Number.isFinite(temperature)) body.temperature = temperature;

    let response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.CorsBlocked"));
    }

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.ApiFailure"));
    }

    if (!response.ok) {
      throw new Error(this.#parseError(data, response.status));
    }

    const text = (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!text) {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.NoResponse"));
    }

    this.#history.push({ role: "assistant", content: text });
    this.#trimHistory();

    try {
      await appendConversationLog(trimmed, text);
    } catch (error) {
      console.warn(`${MODULE_ID} | Failed to write Claude journal`, error);
    }

    return {
      text,
      model: data.model ?? String(body.model),
      usage: data.usage,
    };
  }

  /**
   * Merges the configured system prompt with cached journal context for this conversation.
   * @returns {string|undefined}
   */
  #composeSystem() {
    const parts = [];
    const userPrompt = game.settings.get(MODULE_ID, "systemPrompt")?.trim();
    if (userPrompt) parts.push(userPrompt);
    if (this.#sessionJournalSystem) parts.push(this.#sessionJournalSystem);
    if (this.#sessionSuggestDocuments && game.settings.get(MODULE_ID, "suggestionsEnabled")) {
      parts.push(buildSuggestionsSystemInstruction());
    }
    return parts.length ? parts.join("\n\n") : undefined;
  }

  #trimHistory() {
    const maxTurns = game.settings.get(MODULE_ID, "contextLength") ?? 10;
    const maxMessages = Math.max(2, maxTurns * 2);
    if (this.#history.length > maxMessages) {
      this.#history = this.#history.slice(-maxMessages);
    }
  }

  #parseError(data, status) {
    const apiMessage = data?.error?.message;
    if (apiMessage) {
      if (status === 404 && /model/i.test(apiMessage)) {
        return game.i18n.format("CLAUDE-MOD.Errors.InvalidModel", { detail: apiMessage });
      }
      return apiMessage;
    }
    if (status === 401) return game.i18n.localize("CLAUDE-MOD.Errors.InvalidApiKey");
    if (status === 403) return game.i18n.localize("CLAUDE-MOD.Errors.CorsBlocked");
    if (status === 404) return game.i18n.localize("CLAUDE-MOD.Errors.InvalidModelGeneric");
    return game.i18n.localize("CLAUDE-MOD.Errors.ApiFailure");
  }
}
