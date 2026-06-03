import { ANTHROPIC_API_URL, ANTHROPIC_VERSION, MODULE_ID } from "../constants.js";
import { getApiKey } from "../settings/api-key.js";
import { buildContext } from "./context-builder.js";

export class ClaudeService {
  static #instance = null;

  /** @type {Array<{ role: string, content: string }>} */
  #history = [];

  static getInstance() {
    if (!this.#instance) this.#instance = new ClaudeService();
    return this.#instance;
  }

  resetHistory() {
    this.#history = [];
  }

  /**
   * @param {string} userText
   * @param {{ resetHistory?: boolean }} [options]
   * @returns {Promise<{ text: string, model: string, usage?: object }>}
   */
  async sendMessage(userText, { resetHistory = false } = {}) {
    if (resetHistory) this.resetHistory();

    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.NoApiKey"));
    }

    const trimmed = userText.trim();
    if (!trimmed) {
      throw new Error(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
    }

    const context = buildContext();
    const userContent = context.prefix ? `${context.prefix}\n\n${trimmed}` : trimmed;

    this.#history.push({ role: "user", content: userContent });
    this.#trimHistory();

    const systemPrompt = game.settings.get(MODULE_ID, "systemPrompt")?.trim();
    /** @type {Record<string, unknown>} */
    const body = {
      model: game.settings.get(MODULE_ID, "model"),
      max_tokens: game.settings.get(MODULE_ID, "maxTokens"),
      messages: this.#history,
    };

    if (systemPrompt) body.system = systemPrompt;

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

    return {
      text,
      model: data.model ?? String(body.model),
      usage: data.usage,
    };
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
