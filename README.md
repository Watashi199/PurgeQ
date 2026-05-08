# PurgeQ

A FACEIT player banlist platform. Highlight known cheaters/toxic players directly on FACEIT player cards, manage your list from a popup, and share it with your team.

Two parts:

- **API** — FastAPI backend storing the banlist in Postgres (cached in Redis).
- **Extension** — Chrome/Firefox extension that overlays a Ban / Unban button on every FACEIT player card, with a popup to manage the full list.

![Screenshot placeholder — banned card with red glow and Unban button under the elo]

---

## What it does

- Detects FACEIT nicknames on any FACEIT page (lobby, match, profile, party).
- Shows a red glow + green **Unban** button on a player you previously banned, with the reason on hover.
- Shows a discreet red **Ban** button on hover for clean players, opening an inline form (reason + author).
- Background sync every 60 s so changes from teammates show up automatically.
- Works offline: keeps the last banlist cached locally.

---

## Quick start (self-hosted)

You'll run a small server (Postgres + Redis + the API) and load the extension into your browser. Everything fits on a laptop.

### Requirements

- Docker + Docker Compose
- A modern Chromium browser (Chrome, Edge, Brave, Opera, etc.) or Firefox
- Node.js 18+ (only to build the extension once)

### 1. Clone and configure

```bash
git clone https://github.com/Watashi199/PurgeQ-Renew.git
cd PurgeQ-Renew
cp .env.example .env
```

Open `.env` and **change `VALID_API_KEYS`** to a secret of your choice (this is the password you'll paste into the extension).

```env
VALID_API_KEYS=["pick-a-long-random-string"]
```

### 2. Start the server

```bash
docker compose up -d
```

That brings up Postgres, Redis, and the API on `http://localhost:8000`.
Sanity check: open `http://localhost:8000/docs` — you should see the Swagger UI.

If you want it reachable from your LAN (other devices on your Wi-Fi), note the host's IP (e.g. `http://192.168.1.47:8000`).

### 3. Build the extension

```bash
cd extension
npm install
npm run build
```

This produces `extension/dist/`.

### 4. Load it in your browser

**Chromium:**

1. Visit `chrome://extensions/`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked** → pick `extension/dist/`

**Firefox:** `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on** → pick any file inside `extension/dist/`.

### 5. Configure the extension

Open the popup (icon in the toolbar) → ⚙️ Settings:

- **API server URL:** `http://localhost:8000` (or the LAN IP from step 2)
- **API key:** the one you set in `.env`
- **Default author:** the name that gets stamped on bans you create from FACEIT cards

Click **Save**. Chrome will prompt for permission to access the URL — accept. Use **Test connection** to verify the server is reachable.

That's it. Open a FACEIT match page; banned players get a red glow with an Unban button, clean players get a Ban button on hover.

---

## Usage tips

- The popup also lets you search, add, and remove bans manually.
- The **Refresh** button forces a re-fetch (useful if a teammate just added a ban).
- Bans are case-insensitive on the FACEIT name, so `Watashi-` matches `WATASHI-` and `watashi-`.
- All your data lives in your Postgres volume (`postgres_data`). To wipe everything: `docker compose down -v`.

---

## Sharing a banlist with friends

Anyone with the same `API server URL` + `API key` sees and edits the same list. So:

1. Decide who hosts the server (one person on a VPS, or someone leaves it on at home with port-forward).
2. Pick one shared API key.
3. Distribute that URL + key to your friends.
4. Each of them configures their extension with those values.

For a public-facing hosted setup with per-user namespaces, see "Hosted version" below.

---

## Architecture in two lines

The extension talks to the API over plain HTTP/HTTPS using `X-API-Key` for write access. The service worker keeps a local cache and pushes updates to content scripts via `chrome.runtime.sendMessage`. The API is stateless; Postgres holds the banlist, Redis the rate-limit counters and a 1 h cache of the full list.

If you want the deep dive: [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | — | Server info |
| GET | `/api/v1/health` | — | DB + Redis health |
| GET | `/api/v1/banlist` | — | Full list (rate-limited) |
| POST | `/api/v1/ban` | API key | Add a ban |
| DELETE | `/api/v1/ban/{name}` | API key | Remove a ban |
| POST | `/api/v1/banlist/import` | API key | Bulk-import (JSON or CSV) |

`POST /api/v1/ban` body:

```json
{ "faceit_name": "Watashi-", "reason": "Cheating", "author": "Drazy" }
```

Names: 2–32 ASCII chars (`A–Z a–z 0–9 _ -`). Reason: 1–250 chars. Author: 2–32 chars.

---

## Updating

```bash
git pull
docker compose up -d --build
cd extension && npm run build
```

Then reload the extension in `chrome://extensions/`.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Popup says "Could not reach API" | Server not running, or the URL has no host permission — open Settings → Save again, accept the prompt |
| `chrome.permissions.request: must be called during a user gesture` | Outdated build, run `npm run build` and reload the extension |
| Banned players not highlighted on FACEIT | Hard-refresh the FACEIT tab (Ctrl+F5); the content script attaches at `document_end` |
| `npm run build` fails on `eslint-plugin-react` | `npm install` again — the lockfile may be missing |
| Docker says port 8000 is busy | Edit `API_PORT` in `.env` |

---

## Self-hosted vs hosted version

This repo is the **self-hosted** flavour: you run the server yourself, your data stays on your machine, the API key is whatever you typed in `.env`.

A **public-hosted** flavour is planned (one server, many independent users, each with their own key and their own banlist). Roadmap below.

---

## Public-hosted mode (multi-tenant)

The same codebase runs as a public service where each user gets their own private banlist, identified by an API key.

**Setup on the VPS:**

1. Create a Discord application at <https://discord.com/developers/applications>. Under **OAuth2 → Redirects**, add `https://your-domain/auth/discord/callback`. Copy the **Client ID** and **Client Secret**.
2. In `.env`, fill in (generate the pepper with `python -c "import secrets; print(secrets.token_urlsafe(32))"`):

    ```env
    MULTI_TENANT=true
    API_KEY_PEPPER=<paste-the-generated-secret-here>
    DISCORD_CLIENT_ID=...
    DISCORD_CLIENT_SECRET=...
    DISCORD_REDIRECT_URI=https://your-domain/auth/discord/callback
    PUBLIC_BASE_URL=https://your-domain
    ```

3. `docker compose up -d` and run migrations: `docker compose exec api alembic upgrade head`.
4. Put Caddy/Nginx in front for TLS.

**How users sign up:** they visit `https://your-domain/signup`, click "Sign in with Discord", consent, and get an API key shown once.

**How recovery works:** there isn't a separate flow — they just hit `/signup` again and re-login with Discord. The server detects the same Discord ID, generates a fresh key, and invalidates the previous one. **The user keeps their banlist** because the namespace ID is tied to the Discord account, not to the key value: rotating the key only swaps the hash, not the namespace UUID. No email, no recovery phrase.

**How sharing works:** the API key is the credential. Pasting the same key into another person's extension gives them the same namespace.

**Backward compat:** `MULTI_TENANT=false` (the default) keeps the original behaviour — static keys in `.env`, public GET, single shared banlist.

---

## Stack

- **API:** Python 3.12, FastAPI, async SQLAlchemy 2, Alembic, Pydantic v2
- **Storage:** PostgreSQL 16, Redis 7
- **Extension:** TypeScript, React 18, Vite, Chrome Manifest V3
- **Container:** Docker + Docker Compose

---

## License

MIT — see [LICENSE](LICENSE).
