# PurgeQ — Privacy Policy

_Last updated: 2026-05-18_

PurgeQ is a community-built tool for highlighting banned players on
FACEIT. This policy describes what data is collected, who it's shared
with, and how you can get rid of it.

## What we store

When you sign in with Discord, the following is created in our database
(Supabase, EU region):

- A **profile row** with your Discord user ID, Discord display name
  (pulled from the OAuth response), and a boolean indicating whether
  you have an active Pro subscription (`is_pro`). No email, no Discord
  token, no avatar URL.
- A **personal banlist** owned by you.
- **Ban entries** you create: the FACEIT nickname you flagged, the
  reason you typed, your display name (as author), and a timestamp.
- **Membership rows** when you accept a shared banlist invite.
- **Invite tokens** when you generate a sharable link.

The extension also keeps a local cache of your banlist in
`chrome.storage.local` so FACEIT pages still display markers when the
service is briefly unreachable. The cache contains the same data as
above and is wiped when you sign out.

## What we do **not** store

- No email address.
- No Discord OAuth refresh token after the session ends.
- No IP address tied to your account in our database. Cloudflare logs
  IPs at the edge for fraud / DDoS purposes (standard CDN behaviour),
  retained for 7 days, never joined to your PurgeQ identity.
- No FACEIT credentials, match histories, chat content, or any data
  beyond the nicknames you explicitly flag.
- No analytics, no tracking pixels, no third-party SDKs in the
  extension or on the landing page beyond the auth providers below.

## Processors we share data with

We rely on four vendors. Each is bound by a Data Processing Agreement
(DPA) and stores data in EU regions:

- **Supabase** (database + auth) — your profile and banlist data live
  here. Region: `aws-eu-central-1` (Frankfurt).
- **Cloudflare** — hosts the landing page, the auth bridge page, and
  the Turnstile bot-protection challenge.
- **Discord** — the OAuth identity provider. Discord receives your
  authorisation grant; PurgeQ receives back only your user ID and
  display name.
- **Stripe** — payment processor for Pro subscriptions. When you
  subscribe, Stripe handles card data entirely on their side; PurgeQ
  only receives a webhook confirmation and sets your `is_pro` flag. We
  never see or store your card number, expiry, or CVV.

We do **not** share data with anyone else: no analytics, no advertisers,
no data brokers.

## What the extension reads from web pages

The content script runs on `https://www.faceit.com/*` and reads:

- The **nicknames** displayed on player cards.
- The **`href`** of player profile links (fallback when a nickname
  isn't directly in the card).

These are read so banned nicknames can be visually flagged and the
inline Ban button knows which player you meant. Nicknames are sent to
Supabase only when you explicitly click **Ban**.

The extension does **not** read or transmit your FACEIT login state,
match histories, statistics, chat content, mouse movement, keystrokes,
scroll position, or the content of any other website.

## Your rights (GDPR)

You can exercise these rights at any time, no email needed, directly
from **Settings → Your data** in the extension popup:

- **Right of access / portability** — click **Export my data**. We
  give you a JSON file containing your profile, your banlist, every
  ban you can read, your memberships and your generated invites.
- **Right to erasure** — click **Delete account**. We delete your
  profile, your banlist, every ban you authored, your memberships,
  and your invite tokens. The Supabase auth row is also dropped.
  The action is irreversible.

You also have the right to lodge a complaint with your national data
protection authority (CNIL in France).

## Permissions and why they're needed

- **`storage`** — keep your settings and the cached banlist between
  sessions.
- **`alarms`** — schedule the periodic background refresh (MV3 service
  workers can't keep long-running timers).
- **`identity`** — required by `chrome.identity.launchWebAuthFlow`, which
  opens the Discord OAuth window during sign-in.
- **`https://www.faceit.com/*`** (host permission) — run the content
  script that flags banned players on FACEIT pages.
- **`https://*.supabase.co/*`** (host permission) — talk to the
  Supabase backend.

## Children

PurgeQ is intended for FACEIT users, who must be at least 13 years old
per FACEIT's terms. We do not knowingly collect data from children.

## Contact

PurgeQ is an open-source project. Issues, feature requests and security
reports go through the public issue tracker:

<https://github.com/Watashi199/PurgeQ/issues>

## Changes to this policy

Any future change is reflected in this file in the public repository.
The "Last updated" date is revised when content changes.
