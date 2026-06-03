# claude-mod — Agent Instructions

This workspace is the **Claude Query** Foundry VTT module.

**Project root:** `F:\FoundryVTT\Data\modules\claude-mod`

## Primary Documentation

- [Introduction to Module Development](https://foundryvtt.com/article/module-development/) — canonical guide for module structure, manifest, and loading
- [Modules (Community Wiki)](https://foundryvtt.wiki/en/basics/Modules) — module basics, installation, and development overview
- [Foundry API Wiki](https://foundryvtt.wiki/en/development)
- [Foundry Articles (GitHub)](https://github.com/foundryvtt/foundryvtt/tree/master/articles)
- [Foundry Knowledge Base](https://foundryvtt.com/kb/)

## Module Conventions

- `module.json` at the module root defines the package; `id` must match the folder name (`claude-mod`)
- Use ES modules (`esmodules` in manifest), not legacy `scripts`
- Recommended folder layout: `scripts/`, `styles/`, `templates/`, `packs/`, `lang/`
- Register module logic via Foundry hooks (`init`, `ready`, etc.)
- Target **Foundry VTT 14.360** for compatibility

## Versioning and Releases

- Follow [Semantic Versioning](https://semver.org/)
- Bump `version` in `module.json` with each release
- Maintain `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/)
- Update `manifest` and `download` URLs when publishing releases

## Compatibility Notes

- Current Foundry version: **14.360**
- The [dnd5e system repo](https://github.com/foundryvtt/dnd5e) is a useful API reference — do **not** infer game rules from it

## Project Layout

```plaintext
claude-mod/
  module.json
  README.md
  LICENSE
  CHANGELOG.md
  scripts/
  styles/
  templates/
  lang/
  AGENTS.md
```

Edit files here directly — Foundry loads from this path. Reload the world (F5) after code changes.
