# PurgeQ Auth Page

Lives alongside the landing page in `landing/` and is served from the
same Cloudflare Pages deployment under the `/auth/` path. Bridges the
Chrome extension sign-in flow with Cloudflare Turnstile: Cloudflare
won't let us render a widget directly inside a `chrome-extension://...`
origin, so the extension hands the flow off to this page (hosted on a
real domain we own) and catches the final OAuth callback when it lands
on `https://<extension-id>.chromiumapp.org/...`.

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
deployed as-is via the parent `landing/` directory.

## Cloudflare Pages deployment

Both this page and the landing are served from the same Pages project.
In the Cloudflare dashboard the project is configured with:

- **Build command**: *(empty)*
- **Build output directory**: `landing`
- **Custom domain**: `purgeq.wsrv.xyz`

Result:

- `https://purgeq.wsrv.xyz/` → landing (`landing/index.html`)
- `https://purgeq.wsrv.xyz/auth/` → this page (`landing/auth/index.html`)

## Configuration (one-time)

### Cloudflare Turnstile widget

Dashboard → **Turnstile** → PurgeQ widget → **Gestion des noms d'hôtes**.
The allowed hostname list must contain the page's exact hostname:

- **Add** `purgeq.wsrv.xyz`.
- **Remove** the old `ehszjqppifszlgfanmbp.supabase.co` if still there —
  the widget never renders from there.

The site key in `index.html` and the matching secret in Supabase
(Authentication → Bot Protection) stay unchanged.

### Supabase Auth → URL Configuration

**Redirect URLs** must include `https://<extension-id>.chromiumapp.org/*`
so the OAuth callback can land back at the extension. Set once when
the extension was first registered.

### Extension client

The constant `AUTH_PAGE_URL` in `extension/src/shared/supabase.ts`
points at this deployment. Update it if the domain changes:

```ts
const AUTH_PAGE_URL = 'https://purgeq.wsrv.xyz/auth/';
```

## Local development

Since the page must be served from a hostname that's in the Turnstile
allow-list, you can't just open `index.html` from disk during dev.
Options:

- Use the Cloudflare Pages preview deployment URL (`*.pages.dev`).
  You'll need to add it to the Turnstile hostname list for the
  preview to work.
- Or temporarily switch the site key to the Turnstile test key
  (`1x00000000000000000000AA`) with its matching test secret in
  Supabase Auth → Bot Protection. No hostname check, no real
  bot protection — purely for plumbing tests.

## Security notes

- The Supabase **publishable key** in `index.html` is the same key the
  extension already ships with. It's designed to be public — RLS does
  the actual access control server-side. The Supabase **service_role
  key** is never exposed here.
- The `redirect_to` validation only accepts `https://*.chromiumapp.org`.
  Anyone hitting the page with a different value sees a friendly error
  and the auth flow never starts.
- This page has no cookies, no analytics, no third-party JS beyond the
  Cloudflare Turnstile and Supabase JS CDN scripts. Pure pass-through.
