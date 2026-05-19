# PurgeQ Architecture

## System overview

PurgeQ is a Chrome / Firefox extension backed by a serverless SaaS
stack. The extension is the only code we run on the user's machine; the
backend is fully managed on Supabase + Cloudflare with no application
servers we maintain.

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser Extension (MV3)                    │
│  ┌──────────────┬──────────────┬─────────────────────────┐   │
│  │ Content      │ Background   │ Popup                   │   │
│  │ Script       │ Service      │ (React UI)              │   │
│  │ (FACEIT)     │ Worker       │ banlist / share /       │   │
│  │              │              │ import / export /       │   │
│  │              │              │ settings                │   │
│  └──────┬───────┴──────┬───────┴──────┬──────────────────┘   │
│         │              │              │                       │
│         │   chrome.runtime.sendMessage routing                │
│         │              │              │                       │
│         │              ▼              │                       │
│         │     ┌────────────────────┐  │                       │
│         │     │ chrome.storage      │  │                       │
│         │     │ (session + cache)   │  │                       │
│         │     └────────────────────┘  │                       │
└─────────┼──────────────┬─────────────┼────────────────────────┘
          │              │             │
          │              │             │
          └──────────────┼─────────────┘
                         │ HTTPS, supabase-js
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                     Supabase (eu-central-1)                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Auth (Discord OAuth + Cloudflare Turnstile bot check) │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ PostgREST API (auto-generated CRUD on tables)          │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Postgres                                                │  │
│  │  • profiles, banlists, banlist_members,                │  │
│  │    bans, banlist_invites                                │  │
│  │  • RLS policies enforce per-tenant isolation            │  │
│  │  • RPC: accept_invite, import_bans, delete_my_account   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                         ▲
                         │ OAuth handoff via auth-bridge page
                         │
┌──────────────────────────────────────────────────────────────┐
│              Cloudflare Pages (purgeq.wsrv.xyz)               │
│  ┌──────────────┬───────────────────────────────────────┐    │
│  │ /            │ Landing page (static HTML + JSX)      │    │
│  │ /auth/       │ Turnstile + Discord OAuth bridge      │    │
│  └──────────────┴───────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## Why a bridge auth page

Cloudflare Turnstile refuses to render its widget from a
`chrome-extension://...` origin. The extension can't drive the captcha
challenge directly, so we host a tiny page (`landing/auth/index.html`)
on a real domain Cloudflare accepts. The extension opens that page via
`chrome.identity.launchWebAuthFlow`, the page solves Turnstile and
initiates Supabase OAuth, and the final callback bounces through
`<extension-id>.chromiumapp.org` back to the extension.

## Data model

Five public tables, one enum, all in the `public` schema:

| Table             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `profiles`        | 1:1 with `auth.users`, holds Discord ID + display name |
| `banlists`        | one per user (MVP), owner FK to `auth.users`           |
| `banlist_members` | sharing rows (viewer / editor)                         |
| `bans`            | the actual banned-player entries                       |
| `banlist_invites` | tokens for accepting share invites                     |

Plus the `banlist_role` enum (`viewer | editor`) used by `banlist_members`
and `banlist_invites`.

RLS policies on every table enforce:

- a user can read bans in **their own** banlist OR any banlist they're
  a member of;
- they can write bans in their own or in a banlist where they're an
  editor;
- they can manage members and invites only for banlists they own.

Three helper functions in a private `private` schema (`user_can_read_banlist`,
`user_can_write_banlist`, and the trigger logic in `handle_new_user`)
keep the policies short and readable.

## Source tree

- [`extension/`](extension/) — the browser extension (TypeScript + React,
  Vite build).
  - `src/popup/` — popup React app
  - `src/background/service-worker.ts` — talks to Supabase, caches in
    `chrome.storage.local`, broadcasts BANLIST_UPDATED to tabs
  - `src/content/content-script.ts` — runs on faceit.com, flags banned
    cards and exposes inline Ban / Unban
  - `src/shared/` — shared modules (supabase client, banlist store,
    settings, i18n, DB types)
- [`landing/`](landing/) — static landing page deployed on Cloudflare
  Pages, with `landing/auth/` for the OAuth bridge.
- [`supabase/migrations/`](supabase/migrations/) — versioned SQL
  migrations (schema, RLS policies, RPC functions). Numbered
  chronologically and append-only.

## Local development

- **Extension** — `cd extension && npm install && npm run build`, then
  load `extension/dist/` as an unpacked extension in
  `chrome://extensions`.
- **Auth page** — open `landing/index.html` from the deployed
  Cloudflare Pages preview URL (Turnstile rejects `file://`). Edit
  `landing/auth/index.html` to point at a Supabase preview project if
  needed.
- **Supabase** — schema is reproducible from
  [`supabase/migrations/`](supabase/migrations/) via the Supabase CLI
  or the Studio SQL editor.

## Payments (Pro tier)

Stripe is used for Pro subscriptions. The checkout flow is entirely
Stripe-hosted; the extension never touches card data. On a successful
`checkout.session.completed` event, Stripe sends a webhook to the
`stripe-webhook` Supabase Edge Function, which sets `profiles.is_pro =
true` for the purchasing user via the service-role key. A
`charge.dispute.created` event triggers the reverse (sets `is_pro =
false`). The `is_pro` column is column-level protected so only the
service role can write it — no client-side escalation is possible.

## CI / releases

- [`.github/workflows/release.yml`](.github/workflows/release.yml) fires
  on tag push (semver) — builds the three extension zips, uploads to
  Chrome Web Store and Firefox AMO, and creates a GitHub Release with
  the zips attached.
- See [`extension/REVIEWER_NOTES.md`](extension/REVIEWER_NOTES.md) for
  the store-review checklist.
