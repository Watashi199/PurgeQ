# PurgeQ — landing page

Static site, zero build step. Just upload and serve.

## Deploy

Drop the contents of this folder into your web root. That's it.

```
landing-deploy/
├─ index.html          ← entry point
├─ shared.css
├─ landing.css
├─ strings.js          ← EN/FR translations
├─ i18n.js             ← language toggle
├─ mockup-components.jsx  ← real popup preview in the hero (React + Babel)
├─ tweaks-panel.jsx       ← in-page logo style switcher
└─ assets/
   ├─ logo-shield.svg
   └─ logo-shield.png
```

## Examples

**Nginx**
```nginx
server {
  listen 80;
  server_name purgeq.gg;
  root /var/www/purgeq;
  index index.html;
}
```

**Caddy** (one line)
```
purgeq.gg {
  root * /var/www/purgeq
  file_server
}
```

**Python (quick test)**
```bash
cd landing-deploy && python3 -m http.server 8080
```

## Notes

- All external dependencies (React, Babel, Google Fonts) are loaded over CDN — the site works offline only if those resolve from cache. If you need fully offline, vendor them locally.
- The page is bilingual EN/FR; user choice persists in localStorage.
- Brand assets are in `assets/`. Replace `logo-shield.svg` / `.png` to rebrand without touching the markup.
