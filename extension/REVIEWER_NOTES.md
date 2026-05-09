# Build instructions for Mozilla AMO reviewers

This source archive corresponds to the published `purgeq-<version>.zip` artifact.
To reproduce the exact distribution package, run the following from the
extracted source directory:

```bash
npm install
npm run package
```

The resulting `purgeq-<version>.zip` (sibling of `dist/`) will be byte-similar
to the submitted distribution archive (exact byte equality is not guaranteed
because zip metadata embeds modification timestamps).

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
