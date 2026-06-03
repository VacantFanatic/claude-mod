/**
 * @param {string} question
 * @returns {string}
 */
export function formatPromptChatContent(question) {
  const label = game.i18n.localize("CLAUDE-MOD.Chat.ToClaude");
  return `<div class="claude-mod-chat claude-mod-chat--prompt">
  <header class="claude-mod-chat-header"><i class="fa-solid fa-paper-plane"></i> ${foundry.utils.escapeHTML(label)}</header>
  <div class="claude-mod-chat-body">${foundry.utils.escapeHTML(question)}</div>
</div>`;
}

/**
 * @param {string} text
 * @returns {string}
 */
export function formatResponseChatContent(text) {
  const label = game.i18n.localize("CLAUDE-MOD.Chat.FromClaude");
  return `<div class="claude-mod-chat claude-mod-chat--response">
  <header class="claude-mod-chat-header"><i class="fa-solid fa-sparkles"></i> ${foundry.utils.escapeHTML(label)}</header>
  <div class="claude-mod-response">${foundry.utils.escapeHTML(text)}</div>
</div>`;
}
