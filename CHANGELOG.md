# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.4] - 2026-06-03

### Changed

- Release Assets workflow runs when a `v*` tag is pushed (creates or updates the GitHub release with `claude-mod.zip` and `module.json`); manual **Run workflow** still available

### Fixed

- **Configure Journal Sources** dialog: journal list shows a permanent vertical scrollbar (flex-constrained scroll region, classic WebKit scrollbar styling, and scroll position preserved on re-render)

## [0.3.3] - 2026-06-02

### Fixed

- **Configure Journal Sources** dialog: journal/folder checklist scrolls inside the selection frame when there are many entries

## [0.3.2] - 2026-06-02

### Fixed

- Journal context extraction no longer calls removed `foundry.utils.stripTags` (not available in Foundry v14); uses `DOMParser` instead

## [0.3.1] - 2026-06-02

### Changed

- Journal context is merged into the API **system** prompt instead of prepended to each user message; loaded once per conversation and cached until **New Conversation**
- Conversation history stores only the GM's questions (no repeated journal text in prior turns), reducing token use on multi-turn chats

## [0.3.0] - 2026-06-02

### Added

- **Journal context sources** — mode setting (`Claude Notes only`, `All journals`, `Custom selection`) with **Configure Journal Sources** menu for folder and journal checklists
- **Exclude Conversation Log from Context** setting (default on) to avoid sending the full Q&A log on every request while still logging exchanges
- **Pin for Claude Context** header controls on journal entry and page sheets (GM only); pinned pages override mode and limit context to selected pages only
- Module API: `togglePageContextPin()`, `toggleJournalContextPin()`, `isPageContextPinned()`

### Changed

- Replaced **Include All Other Journals** boolean with journal context mode (worlds with that setting enabled migrate to **All journals** on load)

## [0.2.0] - 2026-06-02

### Added

- Journal integration: optional context from the Claude Notes journal (and optionally all other journals) is prepended to each Claude request
- Automatic conversation log on a dedicated **Claude Notes** journal entry (configurable in module settings)
- **Open Claude Journal** button in the query window
- Module API: `openClaudeJournal()`, `getClaudeJournal()`, `ensureClaudeJournal()`
- Settings: include journal context, read other journals, context character limit, and log exchanges to journal

## [0.1.9] - 2026-06-02

### Added

- Publication-ready `module.json` manifest with `url`, `manifest`, `download`, `readme`, `license`, `changelog`, and `bugs` fields
- `README.md` and `LICENSE` (MIT) for distribution and Foundry package metadata

## [0.1.8] - 2026-06-02

### Added

- Distinctive styling for the query window (accent header, prompt/response panels, highlighted Send button)
- Styled chat cards for Claude prompts and responses with labeled headers and color-coded borders

## [0.1.7] - 2026-06-02

### Fixed

- Scene control Claude button no longer throws `Cannot read properties of undefined (reading 'button')`; tool registry key now matches `name` as Foundry V14 requires

## [0.1.6] - 2026-06-02

### Fixed

- Updated default and selectable Claude models to current Anthropic IDs (`claude-sonnet-4-6`, `claude-haiku-4-5`, `claude-opus-4-6`); retired `claude-sonnet-4-20250514` and `claude-3-5-haiku-20241022`
- Worlds with a saved retired model are migrated automatically on load
- Clearer error message when the API rejects the configured model (404)

## [0.1.5] - 2026-06-02

### Fixed

- Intercept `/w claude` even when no question text follows, preventing Foundry's whisper-to-user error
- Scene control tool uses V14 `onChange` only (removed conflicting `onClick` that caused `reading 'button'` errors)
- Init log now prints module version to verify the server loaded the latest build

## [0.1.4] - 2026-06-02

### Fixed

- Removed deprecated `CONST.CHAT_MESSAGE_TYPES.WHISPER` (removed in Foundry V14); whispers now use the `whisper` recipient array only

## [0.1.3] - 2026-06-02

### Fixed

- `/w claude` now intercepts at `ChatLog.processMessage` before Foundry's built-in whisper handler runs

## [0.1.2] - 2026-06-02

### Fixed

- Foundry V14 scene control button now uses `onChange` so the query window opens
- Chat commands use `ChatLog.CHAT_COMMANDS` (V14 API); `/w claude` whispers work again
- Added `/claude your question` as an alternative chat command
- ApplicationV2 windows use `render({ force: true })` for reliable opening in V14

## [0.1.1] - 2026-06-02

### Changed

- API key is now stored in client-local storage with a password-masked configuration dialog
- Legacy world-scoped API keys are migrated to client storage on first load

## [0.1.0] - 2026-06-02

### Added

- GM-only ApplicationV2 query window with prompt, response panel, and conversation controls
- Anthropic Messages API integration with browser BYOK pattern
- Module settings for API key, model, system prompt, max tokens, temperature, and context length
- `/w claude` and `/w gm-claude` chat whisper commands for quick GM queries
- Scene control button and `Ctrl+Shift+C` keybinding to open the query window
- Stub `ContextBuilder` for future game-context injection

[Unreleased]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.9...HEAD
[0.1.9]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/VacantFanatic/claude-mod/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/VacantFanatic/claude-mod/releases/tag/v0.1.0
