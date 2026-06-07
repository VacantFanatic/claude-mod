# Claude Query

GM-only Anthropic Claude assistant for [Foundry Virtual Tabletop](https://foundryvtt.com/) v13–14.

Query Claude from a dedicated ApplicationV2 window or via chat commands. Your API key stays in browser-local storage (BYOK) and requests go directly to the Anthropic Messages API.

## Features

- **Query window** — prompt, response panel, conversation memory, and styled UI
- **Journal integration** — configurable journal context (Claude Notes only, all journals, or custom folders/journals); pin pages from journal sheets; exchanges logged to **Claude Notes**
- **Chat commands** — `/claude …`, `/w claude …`, `/w gm-claude …`
- **Scene control** — message icon under Journal Notes
- **Keybinding** — `Ctrl+Shift+C` (GM only)
- **Module API** — `openQueryWindow()`, `openClaudeJournal()`, `getClaudeJournal()`, `ensureClaudeJournal()`, `togglePageContextPin()`, `toggleJournalContextPin()`, `isPageContextPinned()`

## Installation

### Manual

1. Copy the `claude-mod` folder into `{userData}/Data/modules/`.
2. Enable **Claude Query** in your world's module settings.
3. Reload the world.

### Install from manifest URL

In Foundry Setup, use **Install Module** with:

`https://github.com/VacantFanatic/claude-mod/releases/latest/download/module.json`

## Configuration

1. Open **Configure Settings → Module Settings → Claude Query**.
2. Click **Configure API Key** and paste your [Anthropic API key](https://console.anthropic.com/).
3. Choose a model, system prompt, and other options as needed.

**Security:** The API key is stored in this browser only, not in the world database. It is still visible in devtools during requests — use a dedicated key with usage limits and enable browser access for your Anthropic organization if required.

## Usage

| Action | How |
|--------|-----|
| Open query window | Journal Notes toolbar → message icon, or `Ctrl+Shift+C` |
| Chat query | `/claude Your question` or `/w claude Your question` |
| New conversation | **New Conversation** in the query window |
| Open Claude journal | **Open Claude Journal** in the query window |
| Journal context sources | **Configure Settings → Claude Query** → **Configure Journal Sources** (mode, folders, journals) |
| Pin journal for Claude | Thumbtack control on an open journal entry or page sheet (GM only) |
| Journal context / logging | Module settings: include context, exclude conversation log, character limit, log exchanges |

## Compatibility

- **Foundry:** minimum v13, verified v14.360
- **System:** system-agnostic (no game-system dependency)

## License

[MIT](LICENSE)
