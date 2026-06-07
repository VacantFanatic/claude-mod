import { ClaudeService } from "../api/claude-service.js";
import { CHAT_ALIASES, MODULE_ID } from "../constants.js";
import { formatPromptChatContent, formatResponseChatContent } from "./chat-format.js";

const WHISPER_PATTERN = /^\/w(?:hisper)?\s+(\[(?:[^\]]+)\]|[^\s]+)(?:\s+([\s\S]*))?$/i;
export const CLAUDE_COMMAND_PATTERN = /^\/claude(?:\s+([\s\S]*))?$/i;

/**
 * @param {string} message
 * @returns {string|false|null} Question text, null if /claude matched without text, or false if not matched
 */
export function parseClaudeSlashMessage(message) {
  const match = message.match(CLAUDE_COMMAND_PATTERN);
  if (!match) return false;
  const question = match[1]?.trim() ?? "";
  return question || null;
}

/**
 * @param {string} message
 * @returns {string|false} Question text, empty string if alias matched with no question, or false if not a Claude whisper
 */
export function parseClaudeWhisper(message) {
  const match = message.match(WHISPER_PATTERN);
  if (!match) return false;

  const aliases = match[1]
    .replace(/[[\]]/g, "")
    .split(",")
    .map((name) => name.trim().toLowerCase());

  if (!aliases.some((alias) => CHAT_ALIASES.includes(alias))) return false;

  return match[2]?.trim() ?? "";
}

export function registerChatCommands() {
  // Register immediately — this runs from module init. A nested Hooks.once("init")
  // would never fire because Foundry snapshots init listeners before calling them.
  registerClaudeSlashCommand();
  Hooks.on("chatMessage", onChatMessage);
}

function getChatLogClass() {
  return foundry.applications?.sidebar?.tabs?.ChatLog ?? ChatLog;
}

function registerClaudeSlashCommand() {
  const ChatLogClass = getChatLogClass();
  if (!ChatLogClass?.CHAT_COMMANDS) {
    console.error(`${MODULE_ID} | Unable to register /claude — ChatLog.CHAT_COMMANDS is unavailable`);
    return;
  }

  ChatLogClass.CHAT_COMMANDS[`${MODULE_ID}.claude`] = {
    rgx: CLAUDE_COMMAND_PATTERN,
    fn: handleClaudeCommand,
  };
}

/**
 * @param {ChatLog} _chatLog
 * @param {string} message
 * @param {object} chatData
 */
function onChatMessage(_chatLog, message, chatData) {
  if (!game.user.isGM || !game.settings.get(MODULE_ID, "chatEnabled")) return;

  const whisperQuestion = parseClaudeWhisper(message);
  if (whisperQuestion !== false) {
    if (!whisperQuestion) {
      ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
      return false;
    }
    void handleClaudeQuery(whisperQuestion, { speaker: chatData.speaker });
    return false;
  }

  const slashQuestion = parseClaudeSlashMessage(message);
  if (slashQuestion !== false) {
    if (slashQuestion === null) {
      ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
      return false;
    }
    void handleClaudeQuery(slashQuestion, { speaker: chatData.speaker });
    return false;
  }
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

  if (!game.settings.get(MODULE_ID, "chatEnabled")) {
    ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Settings.ChatEnabledHint"));
    return false;
  }

  const question = match[1]?.trim() ?? "";
  if (!question) {
    ui.notifications.warn(game.i18n.localize("CLAUDE-MOD.Errors.EmptyPrompt"));
    return false;
  }

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
