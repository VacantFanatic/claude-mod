import { registerApiKeySetting } from "./apps/api-key-config-app.js";
import { registerJournalContextSettings } from "./apps/journal-context-config-app.js";
import { registerChatCommands } from "./chat/chat-commands.js";
import { DEFAULT_MODEL, DEPRECATED_MODELS, JOURNAL_CONTEXT_MODE_DEFAULT, MODEL_CHOICES, MODULE_ID } from "./constants.js";
import {
  ensureClaudeJournal,
  getClaudeJournal,
  isPageContextPinned,
  openClaudeJournal,
  toggleJournalContextPin,
  togglePageContextPin,
} from "./journal/journal-service.js";
import { registerJournalSheetHooks } from "./journal/journal-sheet-hooks.js";
import { migrateWorldApiKey } from "./settings/api-key.js";

async function openQueryWindow() {
  const { ClaudeQueryApplication } = await import("./apps/claude-query-app.js");
  return ClaudeQueryApplication.open();
}

async function openCampaignAssistant() {
  const { CampaignAssistantApplication } = await import("./apps/campaign-assistant-app.js");
  return CampaignAssistantApplication.open();
}

function openPrimaryAssistantWindow() {
  if (game.settings.get(MODULE_ID, "useCampaignAssistant")) {
    return openCampaignAssistant();
  }
  return openQueryWindow();
}

Hooks.once("init", () => {
  const version = game.modules.get(MODULE_ID)?.version ?? "unknown";
  console.log(`${MODULE_ID} | Initializing v${version}`);
  registerSettings();
  registerKeybindings();
  registerChatCommands();
  registerJournalSheetHooks();
  Hooks.on("getSceneControlButtons", onGetSceneControlButtons);
});

Hooks.once("ready", async () => {
  game.modules.get(MODULE_ID).api = {
    openQueryWindow,
    openCampaignAssistant,
    openPrimaryAssistantWindow,
    openClaudeJournal,
    getClaudeJournal,
    ensureClaudeJournal,
    togglePageContextPin,
    toggleJournalContextPin,
    isPageContextPinned,
    createAssistantJournal: async (...args) => {
      const { createAssistantJournal } = await import("./journal/assistant-content-service.js");
      return createAssistantJournal(...args);
    },
    getRecentlyCreated: async (...args) => {
      const { getRecentlyCreated } = await import("./journal/assistant-content-service.js");
      return getRecentlyCreated(...args);
    },
  };

  try {
    await migrateWorldApiKey();
  } catch (error) {
    console.warn(`${MODULE_ID} | API key migration skipped`, error);
  }

  await migrateModelSetting();
  await migrateJournalContextSettings();
  console.log(`${MODULE_ID} | Ready`);
});

async function migrateModelSetting() {
  const current = game.settings.get(MODULE_ID, "model");
  const replacement = DEPRECATED_MODELS[current];

  if (replacement) {
    await game.settings.set(MODULE_ID, "model", replacement);
    console.log(`${MODULE_ID} | Migrated model "${current}" → "${replacement}"`);
    ui.notifications.info(game.i18n.format("CLAUDE-MOD.Settings.ModelMigrated", { from: current, to: replacement }));
    return;
  }

  if (current && !(current in MODEL_CHOICES)) {
    await game.settings.set(MODULE_ID, "model", DEFAULT_MODEL);
    console.warn(`${MODULE_ID} | Unknown model "${current}", reset to "${DEFAULT_MODEL}"`);
  }
}

async function migrateJournalContextSettings() {
  const settingKey = `${MODULE_ID}.journalReadOthers`;
  if (!game.settings.settings.has(settingKey)) return;

  const readOthers = game.settings.get(MODULE_ID, "journalReadOthers");
  const mode = game.settings.get(MODULE_ID, "journalContextMode");

  if (readOthers && mode === JOURNAL_CONTEXT_MODE_DEFAULT) {
    await game.settings.set(MODULE_ID, "journalContextMode", "all");
    console.log(`${MODULE_ID} | Migrated journalReadOthers → journalContextMode "all"`);
  }
}

function registerSettings() {
  registerApiKeySetting();
  registerJournalContextSettings();

  game.settings.register(MODULE_ID, "model", {
    name: "CLAUDE-MOD.Settings.Model",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    choices: MODEL_CHOICES,
    default: DEFAULT_MODEL,
  });

  game.settings.register(MODULE_ID, "maxTokens", {
    name: "CLAUDE-MOD.Settings.MaxTokens",
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    default: 1024,
  });

  game.settings.register(MODULE_ID, "systemPrompt", {
    name: "CLAUDE-MOD.Settings.SystemPrompt",
    hint: "CLAUDE-MOD.Settings.SystemPromptHint",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "You are a helpful assistant for a tabletop Game Master using Foundry VTT. Be concise and practical.",
  });

  game.settings.register(MODULE_ID, "temperature", {
    name: "CLAUDE-MOD.Settings.Temperature",
    hint: "CLAUDE-MOD.Settings.TemperatureHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    range: { min: 0, max: 1, step: 0.1 },
    default: 0.7,
  });

  game.settings.register(MODULE_ID, "contextLength", {
    name: "CLAUDE-MOD.Settings.ContextLength",
    hint: "CLAUDE-MOD.Settings.ContextLengthHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    range: { min: 0, max: 50, step: 1 },
    default: 10,
  });

  game.settings.register(MODULE_ID, "chatEnabled", {
    name: "CLAUDE-MOD.Settings.ChatEnabled",
    hint: "CLAUDE-MOD.Settings.ChatEnabledHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "echoToChat", {
    name: "CLAUDE-MOD.Settings.EchoToChat",
    hint: "CLAUDE-MOD.Settings.EchoToChatHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, "useCampaignAssistant", {
    name: "CLAUDE-MOD.Settings.UseCampaignAssistant",
    hint: "CLAUDE-MOD.Settings.UseCampaignAssistantHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "claudeJournalId", {
    scope: "world",
    config: false,
    restricted: true,
    type: String,
    default: "",
  });

  game.settings.register(MODULE_ID, "journalContextEnabled", {
    name: "CLAUDE-MOD.Settings.JournalContextEnabled",
    hint: "CLAUDE-MOD.Settings.JournalContextEnabledHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true,
  });

  game.settings.register(MODULE_ID, "journalContextMaxChars", {
    name: "CLAUDE-MOD.Settings.JournalContextMaxChars",
    hint: "CLAUDE-MOD.Settings.JournalContextMaxCharsHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    range: { min: 1000, max: 100_000, step: 500 },
    default: 12_000,
  });

  game.settings.register(MODULE_ID, "journalWriteEnabled", {
    name: "CLAUDE-MOD.Settings.JournalWriteEnabled",
    hint: "CLAUDE-MOD.Settings.JournalWriteEnabledHint",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: true,
  });
}

function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "openQueryWindow", {
    name: "CLAUDE-MOD.KeybindingOpenQuery",
    editable: [{ key: "KeyC", modifiers: ["CONTROL", "SHIFT"] }],
    restricted: true,
    onDown: () => {
      void openPrimaryAssistantWindow();
      return true;
    },
  });
}

/**
 * @param {Record<string, { name: string, tools?: Record<string, object> }>} controls
 */
function onGetSceneControlButtons(controls) {
  if (!game.user.isGM) return;

  const tool = {
    name: "claude-query",
    title: "CLAUDE-MOD.SceneControlTitle",
    icon: "fa-solid fa-wand-magic-sparkles",
    order: 6,
    button: true,
    visible: game.user.isGM,
    onChange: () => {
      void openPrimaryAssistantWindow();
    },
  };

  const notes = controls.notes;
  if (notes?.tools) {
    notes.tools["claude-query"] = tool;
    return;
  }

  const tokens = controls.tokens;
  if (tokens?.tools) {
    tokens.tools["claude-query"] = { ...tool, order: Object.keys(tokens.tools).length };
  }
}
