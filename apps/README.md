# apps/

SDKWork application surface roots for Notes.

This repository uses a hybrid layout: the primary PC React/Tauri application is checked in at the repository root as `sdkwork-notes-pc-react/` rather than `apps/sdkwork-notes-pc-react/`. Future surfaces should prefer the standard `apps/<app-key>/` placement when migrated.

| Surface | Path | Manifest |
| --- | --- | --- |
| PC React / Tauri | [../sdkwork-notes-pc-react](../sdkwork-notes-pc-react) | `sdkwork-notes-pc-react/sdkwork.app.config.json` |
| H5 mobile React | [../sdkwork-notes-mobile-react](../sdkwork-notes-mobile-react) | Reserved placeholder |
| Flutter mobile | [../sdkwork-notes-mobile-flutter](../sdkwork-notes-mobile-flutter) | Reserved placeholder |

See [../docs/root-layout.md](../docs/root-layout.md) for the full root dictionary.
