import { MODULE_ID } from "../constants.js";

/**
 * @returns {string}
 */
export function getApiKey() {
  return game.settings.get(MODULE_ID, "apiKey")?.trim() ?? "";
}

/**
 * @returns {boolean}
 */
export function hasApiKey() {
  return Boolean(getApiKey());
}

/**
 * @param {string} apiKey
 */
export async function setApiKey(apiKey) {
  await game.settings.set(MODULE_ID, "apiKey", apiKey.trim());
}

export async function clearApiKey() {
  await game.settings.set(MODULE_ID, "apiKey", "");
}

/**
 * Move a legacy world-scoped API key into client storage.
 */
export async function migrateWorldApiKey() {
  if (!game.user.isGM || hasApiKey()) return;

  const worldSettings = game.settings.storage.get("world");
  const legacySetting = worldSettings?.getSetting?.(`${MODULE_ID}.apiKey`);
  const legacyValue = legacySetting?.value?.trim?.() ?? legacySetting?.value;
  if (!legacyValue) return;

  await setApiKey(legacyValue);

  const legacyDocument = worldSettings?.get?.(`${MODULE_ID}.apiKey`);
  if (legacyDocument) await legacyDocument.delete();

  ui.notifications.info(game.i18n.localize("CLAUDE-MOD.Settings.ApiKeyMigrated"));
}
