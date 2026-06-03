import { ClaudeService } from "../api/claude-service.js";
import { CHAT_ALIASES, MODULE_ID } from "../constants.js";
import { formatPromptChatContent, formatResponseChatContent } from "./chat-format.js";
const WHISPER_PATTERN = /^\/w(?:hisper)?\s+(\[(?:[^\]]+)\]|[^\s]+)(?:\s+([\s\S]*))?$/i;
const CLAUDE_COMMAND_PATTERN = /^\/claude\s+([\s\S]+)/i;

/** @type {boolean} */
let processMessagePatched = false;

export function registerChatCommands() {
  Hooks.once("ready", () => {
    patchProcessMessage();
    registerClaudeSlashCommand();
  });
}

function registerClaudeSlashCommand() {
  const { ChatLog } = foundry.applications.sidebar.tabs;

  ChatLog.CHAT_COMMANDS[`${MODULE_ID}-command`] = {
    rgx: CLAUDE_COMMAND_PATTERN,
    fn: handleClaudeCommand,
  };
}

function patchProcessMessage() {
  if (processMessagePatched) return;

  const { ChatLog } = foundry.applications.sidebar.tabs;
  const originalProcessMessage = ChatLog.prototype.processMessage;

  ChatLog.prototype.processMessage = async function processMessageWithClaude(message, options = {}) {
    const whisperQuestion = parseClaudeWhisper(message);
    if (whisperQuestion !== false) {
      if (!game.user.isGM) {
        ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.GmOnly"));
        return;
      }
      if (!game.settings.get(MODULE_ID, "chatEnabled")) {
        ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Settings.ChatEnabledHint"));
        return;
      }
      if (!whisperQuestion) {
        ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
        return;
      }
      await handleClaudeQuery(whisperQuestion, options);
      return;
    }

    if (game.user.isGM && game.settings.get(MODULE_ID, "chatEnabled")) {
      const commandMatch = message.match(CLAUDE_COMMAND_PATTERN);
      if (commandMatch) {
        const question = commandMatch[1]?.trim();
        if (!question) {
          ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
          return;
        }
        await handleClaudeQuery(question, options);
        return;
      }
    }

    return originalProcessMessage.call(this, message, options);
  };

  processMessagePatched = true;
}

/**
 * @param {string} message
 * @returns {string|false} Question text, empty string if alias matched with no question, or false if not a Claude whisper
 */
function parseClaudeWhisper(message) {
  const match = message.match(WHISPER_PATTERN);
  if (!match) return false;

  const aliases = match[1]
    .replace(/[[\]]/g, "")
    .split(",")
    .map((name) => name.trim().toLowerCase());

  if (!aliases.some((alias) => CHAT_ALIASES.includes(alias))) return false;

  return match[2]?.trim() ?? "";
}

/**
 * @param {string} question
 * @param {object} options
 */
async function handleClaudeQuery(question, options) {
  await ChatMessage.create({
    user: game.user.id,
    speaker: ChatMessage.getSpeaker(options.speaker ?? {}),
    whisper: [game.user.id],
    content: formatPromptChatContent(question),
  });
  await respondInChat(question);
}

/**
 * @param {string} _command
 * @param {RegExpMatchArray} match
 * @param {object} chatData
 * @param {object} createOptions
 */
async function handleClaudeCommand(_command, match, chatData, createOptions) {
  if (!game.user.isGM) {
    ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.GmOnly"));
    return false;
  }

  const question = match[1]?.trim();
  if (!question) return false;

  chatData.whisper = [game.user.id];
  chatData.content = formatPromptChatContent(question);
  delete chatData.type;
  await ChatMessage.create(chatData, createOptions);

  await respondInChat(question);
  return false;
}

/**
 * @param {string} question
 */
async function respondInChat(question) {
  try {
    const result = await ClaudeService.getInstance().sendMessage(question);
    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ alias: game.i18n.localize("CLAUDE-MOD.Chat.FromClaude") }),
      content: formatResponseChatContent(result.text),
      whisper: [game.user.id],
    });
  } catch (error) {
    console.error(`${MODULE_ID} | Chat command failed`, error);
    ui.notifications.error(error.message, { permanent: false, console: false });
  }
}
