# PurgeQ Auth Page

Tiny static page that bridges the Chrome extension sign-in flow with
Cloudflare Turnstile. Cloudflare won't let us render a Turnstile widget
directly inside a `chrome-extension://...` origin, so the extension
hands the flow off to this page (hosted on a real domain we own) and
catches the final OAuth callback when it lands on
`https://<extension-id>.chromiumapp.org/...`.

## What it does

1. Receives a `redirect_to` query parameter from the extension —
   strictly validated to be `https://*.chromiumapp.org` so the page
   can't be turned into an open-redirect.
2. Renders the Turnstile widget (dark theme, managed mode).
3. On a successful Turnstile token, calls
   `supabase.auth.signInWithOAuth({ provider: 'discord', captchaToken, redirectTo })`
   to get the Discord OAuth URL.
4. Redirects the browser to that URL. Discord → Supabase callback →
   the configured `redirect_to` → the extension catches it via
   `chrome.identity.launchWebAuthFlow`.

The page is a single self-contained `index.html` with no build step —
just upload it as-is.

## Deploy with Cloudflare Pages (recommended)

1. Sign in to the Cloudflare dashboard → **Workers & Pages** → **Create
   application** → **Pages** → **Connect to Git**.
2. Pick this repository, set:
   - **Build command**: *(leave empty)*
   - **Build output directory**: `auth-page`
3. Deploy. You'll get a `*.pages.dev` URL.
4. Under **Custom domains**, add the subdomain you want — e.g.
   `auth.wsrv.xyz`. Cloudflare provisions the certificate automatically
   if the parent zone is on your Cloudflare account.

## Configuration steps (one-time, per environment)

After the page is live at e.g. `https://auth.wsrv.xyz/`:

### Cloudflare Turnstile widget

Dashboard → **Turnstile** → your PurgeQ widget → **Gestion des noms
d'hôtes**.

- **Remove** `ehszjqppifszlgfanmbp.supabase.co` — not used anymore.
- **Add** the exact hostname of this page (e.g. `auth.wsrv.xyz`).
  Cloudflare requires an exact subdomain match.

The site key in `index.html` and the matching secret in Supabase
(Authentication → Bot Protection) stay unchanged.

### Supabase Auth → URL Configuration

**Redirect URLs** must include `https://<extension-id>.chromiumapp.org/*`
so the OAuth callback can land back at the extension. You should already
have this from the original setup — no change needed.

### Extension client (`extension/src/shared/supabase.ts`)

The `AUTH_PAGE_URL` constant must point at this deployment:

```ts
const AUTH_PAGE_URL = 'https://auth.wsrv.xyz/';
```

Build the extension and reload it for the change to apply.

## Local development

Since the page must be served from a hostname that's in the Turnstile
allow-list, you can't just open `index.html` from disk during dev.
Options:

- Use the Cloudflare Pages preview deployment URL (e.g.
  `*.pages.dev`). You'll need to add it to the Turnstile hostname list
  for the preview to work, or use the Turnstile test site key
  (`1x00000000000000000000AA`) with its matching test secret in Supabase.
- Or use a local tunnel (`cloudflared tunnel`, `ngrok`) pointed at a
  static server like `python -m http.server`, with the tunnel hostname
  added to Turnstile.

## Security notes

- The Supabase **publishable key** in `index.html` is the same key the
  extension already ships with. It's designed to be public — RLS does
  the actual access control server-side. The Supabase **service_role
  key** is never exposed here.
- The `redirect_to` validation only accepts `https://*.chromiumapp.org`.
  Anyone hitting the page with a different value sees a friendly error
  and the auth flow never starts.
- This page has no cookies, no analytics, no third-party JS beyond the
  Cloudflare Turnstile and Supabase JS CDN scripts. It's pure
  pass-through.
