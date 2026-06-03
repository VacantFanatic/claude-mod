import { ClaudeQueryApplication } from "./apps/claude-query-app.js";
import { registerApiKeySetting } from "./apps/api-key-config-app.js";
import { registerChatCommands } from "./chat/chat-commands.js";
import { DEFAULT_MODEL, DEPRECATED_MODELS, MODEL_CHOICES, MODULE_ID } from "./constants.js";
import { migrateWorldApiKey } from "./settings/api-key.js";

const openQueryWindow = () => ClaudeQueryApplication.open();

Hooks.once("init", () => {
  const version = game.modules.get(MODULE_ID)?.version ?? "unknown";
  console.log(`${MODULE_ID} | Initializing v${version}`);
  registerSettings();
  registerKeybindings();
  registerChatCommands();
  Hooks.on("getSceneControlButtons", onGetSceneControlButtons);
});

Hooks.once("ready", async () => {
  game.modules.get(MODULE_ID).api = { openQueryWindow };

  try {
    await migrateWorldApiKey();
  } catch (error) {
    console.warn(`${MODULE_ID} | API key migration skipped`, error);
  }

  await migrateModelSetting();
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

function registerSettings() {
  registerApiKeySetting();
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
}

function registerKeybindings() {
  game.keybindings.register(MODULE_ID, "openQueryWindow", {
    name: "CLAUDE-MOD.KeybindingOpenQuery",
    editable: [{ key: "KeyC", modifiers: ["CONTROL", "SHIFT"] }],
    restricted: true,
    onDown: () => {
      openQueryWindow();
      return true;
    },
  });
}

/**
 * @param {Record<string, { name: string, tools?: Record<string, object> }>} controls
 */
function onGetSceneControlButtons(controls) {
  if (!game.user.isGM) return;

  const notes = controls.notes;
  if (!notes?.tools) return;

  notes.tools["claude-query"] = {
    name: "claude-query",
    title: "CLAUDE-MOD.SceneControlTitle",
    icon: "fa-solid fa-message",
    order: 6,
    button: true,
    visible: game.user.isGM,
    onChange: () => {
      void openQueryWindow();
    },
  };
}
