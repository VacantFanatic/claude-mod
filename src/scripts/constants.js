export const MODULE_ID = "claude-mod";
export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";
export const CHAT_ALIASES = ["claude", "gm-claude"];

export const DEFAULT_MODEL = "claude-sonnet-4-6";

/** @type {Record<string, string>} */
export const MODEL_CHOICES = {
  "claude-sonnet-4-6": "CLAUDE-MOD.Models.claude-sonnet-4-6",
  "claude-haiku-4-5": "CLAUDE-MOD.Models.claude-haiku-4-5",
  "claude-opus-4-6": "CLAUDE-MOD.Models.claude-opus-4-6",
};

/** Retired model IDs mapped to their replacements. */
export const DEPRECATED_MODELS = {
  "claude-sonnet-4-20250514": "claude-sonnet-4-6",
  "claude-3-5-haiku-20241022": "claude-haiku-4-5",
};

/** @type {Record<string, string>} */
export const JOURNAL_CONTEXT_MODE_CHOICES = {
  claudeOnly: "CLAUDE-MOD.Settings.JournalContextModeClaudeOnly",
  all: "CLAUDE-MOD.Settings.JournalContextModeAll",
  custom: "CLAUDE-MOD.Settings.JournalContextModeCustom",
};

export const JOURNAL_CONTEXT_MODE_DEFAULT = "claudeOnly";

/** @type {Record<string, string>} */
export const WORLD_SUMMARY_MODE_CHOICES = {
  excerpt: "CLAUDE-MOD.Settings.WorldSummaryModeExcerpt",
  ai: "CLAUDE-MOD.Settings.WorldSummaryModeAi",
  hybrid: "CLAUDE-MOD.Settings.WorldSummaryModeHybrid",
};
export const CONTEXT_PINNED_FLAG = "contextPinned";
export const ASSISTANT_CREATED_FLAG = "assistantCreated";
export const ASSISTANT_CREATE_TYPE_FLAG = "assistantCreateType";
