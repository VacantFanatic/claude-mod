# Claude Query

GM-only Anthropic Claude assistant for [Foundry Virtual Tabletop](https://foundryvtt.com/) v13–14.

The installable module lives in [`src/`](src/). This repository root holds development tooling (`package.json`, `tests/`, GitHub Actions).

## Quick links

- [Module readme & user docs](src/README.md)
- [Changelog](src/CHANGELOG.md)

## Development

```bash
npm install
npm test
```

Point your Foundry `Data/modules/claude-mod` folder at `src/` (symlink or copy). Reload the world (F5) after code changes.

### Troubleshooting

If `/claude` says it is not a valid command or the scene control button is missing:

1. Confirm `module.json` lives directly at `Data/modules/claude-mod/module.json` (not inside a nested `src/` folder unless you symlinked correctly).
2. Open the browser console (F12) and look for `claude-mod | Initializing` and `claude-mod | Ready` after loading a world.
3. Ensure **Claude Query** is enabled in your world's module settings.
4. Install from the [latest release](https://github.com/VacantFanatic/claude-mod/releases/latest) rather than copying the full git repository root.

## Releasing

1. Update [`src/CHANGELOG.md`](src/CHANGELOG.md) and bump `version` in [`src/module.json`](src/module.json).
2. Push to `main` and create a `v*` tag. The [Release Assets](.github/workflows/release.yml) workflow zips `src/` only.

## License

[MIT](src/LICENSE)
