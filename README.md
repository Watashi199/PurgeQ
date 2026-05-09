# PurgeQ

**Your personal cheater/toxic-player blacklist for FACEIT.**

PurgeQ lets you flag players you never want to queue with again. The names are highlighted directly on FACEIT player cards, in any lobby, match room, party, or profile page — so you spot a known troll before the match even starts. Build your list solo, or share it with your team and edit it together.

![Screenshot placeholder — banned card with red glow and Unban button under the elo]

Two parts:

- **API** — small FastAPI backend that stores the banlist (Postgres + Redis cache).
- **Extension** — Chrome / Firefox extension that overlays a Ban / Unban button on every player card and gives you a popup to manage the full list.

---

## What you get

- 🔴 **Visual highlight** — banned players get a red glow + their nickname turns red on the card; their reason shows on hover.
- ⚡ **One-click ban** — hover any player card and click **Ban** to add them with a reason.
- 🔄 **Live sync** — when a new player joins your lobby, PurgeQ checks the server in real time so your teammates' bans show up almost instantly.
- 📥 **Import** — bulk-add a list of names from a JSON or CSV file (good for migrating from another tool or sharing a starter list).
- 📤 **Export** — download your banlist as JSON or CSV any time, for backup or sharing.
- 🛜 **Works offline** — the extension caches the last list locally, so the highlights still show up even if your server is down.
- 🤝 **Team friendly** — point several extensions at the same server with the same API key and everyone sees the same list, with edits propagating in seconds.

---

## Quick start (self-hosted)

You run a small server (Postgres + Redis + the API) and load the extension into your browser. Everything fits on a laptop, a Raspberry Pi, or a $5 VPS.

### Requirements

- **Docker** + Docker Compose
- A Chromium-based browser (Chrome, Edge, Brave, Opera…) or Firefox
- **Node.js 18+** (only needed once, to build the extension)

### 1. Clone and configure

```bash
git clone https://github.com/Watashi199/PurgeQ-Renew.git
cd PurgeQ-Renew
cp .env.example .env
```

Open `.env` and **change `VALID_API_KEYS`** to a secret of your choice. This is the password you'll paste into the extension — pick something long and random.

```env
VALID_API_KEYS=["pick-a-long-random-string"]
```

### 2. Start the server

```bash
docker compose up -d
```

That spins up Postgres, Redis, and the API on `http://localhost:8000`. The first start runs the database migrations automatically.

Sanity check: open `http://localhost:8000/docs` — you should see the Swagger UI.

If you want it reachable from your LAN (so other devices on your Wi-Fi can use it), note the host's IP, e.g. `http://192.168.1.10:8000`.

### 3. Build the extension

```bash
cd extension
npm install
npm run build
```

This produces `extension/dist/` — the folder you'll load into your browser.

### 4. Load it in your browser

**Chromium:**

1. Visit `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked** → select `extension/dist/`

**Firefox:** Visit `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick any file inside `extension/dist/`.

### 5. Configure the extension

Click the PurgeQ icon in your toolbar to open the popup, then go to **Settings**:

- **API server URL** — `http://localhost:8000` (or the LAN IP from step 2)
- **API key** — the value you set in `.env`
- **Default author** — your name. This is stamped on every ban you create from a FACEIT card, so you only set it once

Click **Save**. Your browser will ask permission to access the URL — accept. Use **Test connection** to confirm the server is reachable.

That's it. Open a FACEIT match page or lobby — banned players get a red glow with an **Unban** button, clean players get a discreet **Ban** button on hover.

---

## Using PurgeQ

### From a FACEIT page

- **Ban someone**: hover their card, click the red **Ban** button → fill the reason, hit Confirm. The author is filled automatically from your settings.
- **Unban someone**: their card already has a green **Unban** button — click it, confirm.

### From the popup

The popup has four tabs:

- **Banlist** — search, scroll, delete entries, and add new ones manually (no FACEIT page needed).
- **Import** — drop a `.json` or `.csv` file to bulk-add names. Existing entries are skipped.
- **Export** — download the current banlist as JSON or CSV. The JSON export round-trips through Import for backups.
- **Settings** — server URL, API key, default author.

The footer of the sidebar always shows your current server URL and the total number of banned players, so you know at a glance you're connected to the right place.

### Sharing with friends

Anyone using the same `API server URL` + `API key` sees and edits the same list. So:

1. One person hosts the server (a VPS, a NAS, an always-on PC at home with port-forwarding…).
2. You agree on a shared API key.
3. Everyone configures their extension with that URL + key.
4. You all see the same banlist; bans your friends add appear on your screen within a few seconds.

---

## Import / Export formats

### JSON

```json
{
  "items": ["Watashi-", "Foo", "Bar"]
}
```

…or with full details:

```json
{
  "items": [
    { "faceit_name": "Watashi-", "reason": "Cheating", "author": "Drazy" }
  ],
  "default_author": "Drazy",
  "default_reason": "Imported"
}
```

A bare array (`["a", "b", "c"]` or `[{...}, {...}]`) is also accepted.

### CSV

The first row must be a header. Recognised columns: `faceit_name` (or `name` / `nickname` / `player`), `reason` (optional), `author` (optional). Anything missing falls back to the values you provide. Example:

```csv
faceit_name,reason,author
Watashi-,Cheating,Drazy
Foo,Toxic,Drazy
```

The CSV import endpoint also accepts `?author=…` in the query string for files that have no author column.

---

## Endpoints (if you want to script things)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | Server info |
| GET | `/api/v1/health` | — | DB + Redis health |
| GET | `/api/v1/banlist` | — (self-hosted) / API key (multi-tenant) | Full list |
| POST | `/api/v1/ban` | API key | Add a ban |
| DELETE | `/api/v1/ban/{name}` | API key | Remove a ban |
| POST | `/api/v1/banlist/import` | API key | Bulk import (JSON or CSV) |

`POST /api/v1/ban` body:

```json
{ "faceit_name": "Watashi-", "reason": "Cheating", "author": "Drazy" }
```

**Validation rules:** name 2–32 chars (`A–Z a–z 0–9 _ -`), reason 1–250 chars, author 2–32 chars. Names are matched case-insensitively, so `Watashi-` and `WATASHI-` are the same player.

---

## Updating

```bash
git pull
docker compose up -d --build
cd extension && npm run build
```

Then reload the extension in `chrome://extensions/` (or Firefox's debugging page).

Migrations run automatically on the next container start.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Popup says "Could not reach API" | Server not running, or no host permission — open Settings → Save again, accept the prompt |
| Failed to fetch when banning | Same, or your browser is blocking HTTP from an HTTPS page; use the LAN IP that matches the API |
| Banned players not highlighted on FACEIT | Hard-refresh the FACEIT tab (Ctrl+F5) — the content script attaches at `document_end` |
| `Set a default author` error after clicking Ban | Open the popup → Settings → fill **Default author** and save |
| `chrome.permissions.request: must be called during a user gesture` | Outdated build — run `npm run build` and reload the extension |
| `npm run build` fails | `npm install` again, the lockfile may need refreshing |
| Docker says port 8000 is busy | Edit `API_PORT` in `.env` |
| Old DB without migrations | `docker compose run --rm api alembic stamp 001_initial_schema && docker compose run --rm api alembic upgrade head` |

---

## Self-hosted vs hosted

This repo is the **self-hosted** flavour: you run the server yourself, your data stays on your machine, the API key is whatever you typed in `.env`. One server = one shared banlist.

A **public-hosted** flavour also exists in this same codebase (one server, many independent users, each with their own private banlist, signed in via Discord). Read on if you want to host PurgeQ as a public service.

---

## Public-hosted mode (multi-tenant)

The same code can run as a multi-user service where each Discord account gets its own private banlist behind its own API key.

### Setup on the VPS

1. Create a Discord application at <https://discord.com/developers/applications>.
   Under **OAuth2 → Redirects**, add `https://your-domain/auth/discord/callback`.
   Copy the **Client ID** and **Client Secret**.
2. Generate a server-side pepper (used to hash API keys at rest):

   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. Fill in `.env`:

   ```env
   MULTI_TENANT=true
   API_KEY_PEPPER=<paste-the-generated-secret>
   DISCORD_CLIENT_ID=...
   DISCORD_CLIENT_SECRET=...
   DISCORD_REDIRECT_URI=https://your-domain/auth/discord/callback
   PUBLIC_BASE_URL=https://your-domain
   ```

4. `docker compose up -d --build` — migrations run automatically.
5. Put Caddy / Nginx / Traefik in front for HTTPS (Discord rejects non-HTTPS callback URLs).

### How users sign up

They visit `https://your-domain/signup`, click **Sign in with Discord**, consent, and the page shows them their API key **once**. They paste it into the extension's Settings tab and they're live.

### How recovery works

There's no separate recovery flow. If a user loses their key, they just hit `/signup` again and re-login with Discord. The server detects the same Discord ID, generates a fresh key, and invalidates the previous one. **Their banlist is preserved**, because the namespace is tied to the Discord account, not to the key value.

No email, no security questions, no password resets.

### How sharing works in multi-tenant

Each API key owns one private banlist. To share, give the key to a teammate — pasting the same key into another extension shows the same list. (More structured team/sub-key support is on the roadmap.)

### Backward-compat

`MULTI_TENANT=false` (the default) keeps the original behaviour — static keys in `.env`, public GET, single shared banlist. Flipping the flag is a one-way operation in the sense that fresh data goes into the new schema, but the migrations handle the transition.

---

## Stack

- **API**: Python 3.12, FastAPI, async SQLAlchemy 2, Alembic, Pydantic v2
- **Storage**: PostgreSQL 16, Redis 7
- **Extension**: TypeScript, React 18, Vite, Chrome Manifest V3
- **Container**: Docker + Docker Compose

For the architecture deep-dive: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## License

MIT — see [LICENSE](LICENSE).
