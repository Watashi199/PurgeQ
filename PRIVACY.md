# PurgeQ — Privacy Policy

_Last updated: 2026-05-09_

PurgeQ is an open-source, **self-hosted** browser extension. The developer of the extension does not run any centralized service, does not collect any data from users, and does not have any way to see what is stored or transmitted on a user's installation.

This document describes what the extension itself stores on your device and what it transmits, so you have a complete picture of where your data goes.

## Data stored locally on your device

The extension uses Chrome / Firefox's local extension storage (`chrome.storage.local`) to remember the following between sessions:

- The **API server URL** you configured in Settings.
- The **API key** you configured in Settings (used to authenticate with your server).
- The **Default author** name you configured in Settings (stamped on bans you create from FACEIT cards).
- A **cached copy of your banlist** (for offline display and to avoid hitting the server on every page load).

This data never leaves your device except as described in the "Data transmitted" section below. It is not synchronized to any cloud account, not even Chrome's own sync.

## Data transmitted

The extension performs HTTP requests **only to the API server URL you configured yourself**. It never contacts any other server (no analytics endpoint, no telemetry endpoint, no third-party service).

When you take an action, the following data is sent to your configured server:

- **Adding a ban** (POST `/api/v1/ban`): the player's FACEIT nickname (read from the DOM of the FACEIT page), the reason you typed, and the author name from your settings. The API key is sent in the `X-API-Key` HTTP header.
- **Removing a ban** (DELETE `/api/v1/ban/{name}`): the player's FACEIT nickname. The API key is sent in the `X-API-Key` header.
- **Refreshing the banlist** (GET `/api/v1/banlist`): no request body. In multi-tenant mode, the API key is sent in the header.
- **Importing a banlist** (POST `/api/v1/banlist/import`): the contents of the file you selected. The API key is sent in the header.

That server is operated by you, by someone you trust, or by a public PurgeQ host you chose to use. The PurgeQ developer has no access to it.

## Data read from web pages

The extension's content script runs on `https://www.faceit.com/*` and reads:

- The **nicknames** displayed on player cards.
- The **`href`** of player profile links (used as a fallback when a nickname isn't directly in the card).

These are read so that banned nicknames can be highlighted on screen and so that clicking the inline Ban button knows which player you mean. They are sent to your configured server only when you explicitly click Ban.

The extension does **not** read or transmit:

- Your FACEIT account information, login state, email, or password.
- Match histories, statistics, or chat content.
- The content of any other website.
- Mouse movement, keystrokes, or scroll position.

## Data sharing

The PurgeQ extension does not share any data with the developer, with any third party, or with any analytics / advertising service. There is no "us" with which to share.

What happens on the server you configure depends on whoever runs it. If you self-host, that's you. If you use a public PurgeQ host, ask the operator for their own privacy policy.

## Permissions and why they're needed

- **`storage`** — to keep your settings and the cached banlist between sessions.
- **`alarms`** — to schedule the periodic background refresh of the banlist (Manifest V3 service workers cannot keep long-running timers, so `chrome.alarms` is required).
- **`https://www.faceit.com/*`** (host permission) — to run the content script that reads nicknames and injects the Ban / Unban buttons on FACEIT pages.
- **`http://*/*`** and **`https://*/*`** (optional host permissions) — requested at runtime, only when you save a custom server URL in Settings. Needed because PurgeQ is self-hosted and the extension cannot know your server URL in advance. You see and approve the standard browser permission prompt; you can deny it.

## Data retention and deletion

Local data:

- Uninstalling the extension wipes all locally stored data, including the cached banlist and your saved settings.
- Clicking the **Reset** button in Settings clears all settings.

Server data (your own server):

- You control retention on your own server. The provided backend exposes `DELETE /api/v1/ban/{name}` to remove individual bans, and you can drop the database volume (`docker compose down -v`) to wipe everything.

## Children

PurgeQ is intended for FACEIT users, who must be at least 13 years old per FACEIT's own terms. The extension does not knowingly collect data from children.

## Contact

PurgeQ is an open-source project. Issues, feature requests and security reports go through the public issue tracker:

<https://github.com/Watashi199/PurgeQ/issues>

## Changes to this policy

Any future change to this policy will be reflected in this file in the public repository. The "Last updated" date at the top of this document will be revised when the content changes.
