import { clearApiKey, hasApiKey, setApiKey } from "../settings/api-key.js";
import { MODULE_ID } from "../constants.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ApiKeyConfigApplication extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "claude-mod-api-key-config",
    classes: ["claude-mod", "api-key-config"],
    tag: "form",
    position: {
      width: 480,
      height: "auto",
    },
    window: {
      title: "CLAUDE-MOD.Settings.ApiKeyMenuName",
    },
    form: {
      handler: ApiKeyConfigApplication.#onSubmitForm,
      closeOnSubmit: true,
      submitOnChange: false,
    },
    actions: {
      clearApiKey: ApiKeyConfigApplication.#onClearApiKey,
    },
  };

  static PARTS = {
    content: {
      template: "modules/claude-mod/templates/api-key-config.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.hasExistingKey = hasApiKey();
    return context;
  }

  /**
   * @this {ApiKeyConfigApplication}
   * @param {SubmitEvent} event
   * @param {HTMLFormElement} form
   * @param {FormDataExtended} formData
   */
  static async #onSubmitForm(event, form, formData) {
    const apiKey = formData.object.apiKey?.trim?.() ?? String(formData.object.apiKey ?? "").trim();

    if (!apiKey) {
      if (hasApiKey()) {
        ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Settings.ApiKeyUnchanged"));
        return;
      }
      ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Settings.ApiKeyRequired"));
      return;
    }

    await setApiKey(apiKey);
    ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Settings.ApiKeySaved"));
  }

  /** @this {ApiKeyConfigApplication} */
  static async #onClearApiKey(event) {
    event.preventDefault();
    const confirmed = await Dialog.confirm({
      title: game.i18n.localize("CLAUDE-MOD.Settings.ClearApiKey"),
      content: `<p>${game.i18n.localize("CLAUDE-MOD.Settings.ClearApiKeyConfirm")}</p>`,
    });
    if (!confirmed) return;

    await clearApiKey();
    ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Settings.ApiKeyCleared"));
    await this.render({ force: true });
  }
}

/**
 * Register the API key setting and configuration menu.
 */
export function registerApiKeySetting() {
  game.settings.register(MODULE_ID, "apiKey", {
    name: "CLAUDE-MOD.Settings.ApiKey",
    hint: "CLAUDE-MOD.Settings.ApiKeyHint",
    scope: "client",
    config: false,
    type: String,
    default: "",
  });

  game.settings.registerMenu(MODULE_ID, "apiKeyConfig", {
    name: "CLAUDE-MOD.Settings.ApiKeyMenuName",
    label: "CLAUDE-MOD.Settings.ApiKeyMenuLabel",
    hint: "CLAUDE-MOD.Settings.ApiKeyMenuHint",
    icon: "fa-solid fa-key",
    type: ApiKeyConfigApplication,
    restricted: true,
  });
}
