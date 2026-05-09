# Build instructions for Mozilla AMO reviewers

This source archive corresponds to the published `purgeq-<version>.zip` artifact.
To reproduce the exact distribution package, run the following from the
extracted source directory:

For the **Firefox** build:

```bash
npm install
npm run package:firefox
```

The resulting `purgeq-firefox-<version>.zip` is byte-similar to the submitted
archive (exact byte equality is not guaranteed because zip metadata embeds
modification timestamps).

For the **Chrome** build (provided here for completeness):

```bash
npm run package
```

Both commands share `npm run build` (Vite); they differ only in the manifest
that ends up in the zip. Chrome MV3 rejects `background.scripts`, so the base
`manifest.json` is Chrome-compatible. The `--firefox` flag merges
`manifest.firefox.json` into it before zipping, adding the
`browser_specific_settings` block and the `background.scripts` fallback that
the AMO validator requires.

## Environment

- Node.js 18 LTS or newer
- npm 9 or newer
- No native dependencies, no platform-specific tooling

## What the build does

`npm run package` runs two steps:

1. `vite build` — bundles the TypeScript source under `src/` into ES modules
   in `dist/` (see `vite.config.ts`). Minification is disabled so the output
   stays human-readable. The Vite plugin `copyStaticAssets` copies
   `manifest.json`, `popup.html`, `popup.css` and the `images/` folder into
   `dist/` after bundling.
2. `node scripts/zip-dist.js` — packages the contents of `dist/` (with
   `manifest.json` at the root) into a zip file using the standard
   library only (no third-party zip dependency).

## File / module map

- `src/popup/popup.tsx` → `dist/popup.js` (loaded by `popup.html`)
- `src/background/service-worker.ts` → `dist/background.js`
  (registered as the MV3 background service worker)
- `src/content/content-script.ts` → `dist/content.js`
  (injected into `https://www.faceit.com/*` pages at `document_end`)
- `src/shared/utils.ts` and `src/shared/settings.ts` are shared modules used
  by the popup and the service worker.

## Network access

The extension only contacts the user-configured API server URL (entered in
the popup's Settings tab). No third-party endpoints, analytics, or telemetry
are involved.

## License

MIT — full source on GitHub: <https://github.com/Watashi199/PurgeQ>.
