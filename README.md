# Claude Query

GM-only Anthropic Claude assistant for [Foundry Virtual Tabletop](https://foundryvtt.com/) v13–14.

Query Claude from a dedicated ApplicationV2 window or via chat commands. Your API key stays in browser-local storage (BYOK) and requests go directly to the Anthropic Messages API.

## Features

- **Query window** — prompt, response panel, conversation memory, and styled UI
- **Chat commands** — `/claude …`, `/w claude …`, `/w gm-claude …`
- **Scene control** — message icon under Journal Notes
- **Keybinding** — `Ctrl+Shift+C` (GM only)
- **Module API** — `game.modules.get("claude-mod").api.openQueryWindow()`

## Installation

### Manual

1. Copy the `claude-mod` folder into `{userData}/Data/modules/`.
2. Enable **Claude Query** in your world's module settings.
3. Reload the world.

### Install from manifest URL

In Foundry Setup, use **Install Module** with:

`https://github.com/VacantFanatic/claude-mod/releases/latest/download/module.json`

## Releasing

1. Update [CHANGELOG.md](CHANGELOG.md) on `main`.
2. On GitHub, open **Releases → Draft a new release**.
3. Create a tag in `v0.0.0` format (e.g. `v0.1.10`) — the workflow sets `module.json` `version` from this tag.
4. Save as **draft** (or publish when ready). Creating the release triggers the [Release Assets](.github/workflows/release.yml) workflow, which uploads `module.json` and `claude-mod.zip`.
5. When the workflow finishes, publish the release if it is still a draft.

Re-run the workflow from the **Actions** tab if you need to rebuild assets for the same tag.

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

## Compatibility

- **Foundry:** minimum v13, verified v14.360
- **System:** system-agnostic (no game-system dependency)

## Development

Project root: `Data/modules/claude-mod`

Reload the world (F5) after code changes. See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE)
