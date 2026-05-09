#!/usr/bin/env bash
# PurgeQ — one-shot installer.
#
# Generates a random API key, writes a working .env, brings up the stack,
# builds the browser extension if Node is available, and prints the URL +
# key the user should paste into the extension's Settings.
#
# Re-run is idempotent: existing .env is preserved.

set -e

if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  fi
fi

cd "$(dirname "$0")"

bold() { printf '\033[1m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }
dim() { printf '\033[2m%s\033[0m\n' "$*"; }
ok() { green "✓ $*"; }
fail() { red "✗ $*"; }
note() { dim "  $*"; }

bold "PurgeQ installer"
echo

# ─── 1. Prerequisites ──────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed. See https://docs.docker.com/engine/install/"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  fail "Docker Compose v2 is required (\`docker compose\`, not \`docker-compose\`)."
  exit 1
fi
ok "Docker + Docker Compose detected"

# ─── 2. .env ───────────────────────────────────────────────────────────────
if [ -f .env ]; then
  ok ".env already exists — keeping current values"
  GENERATED_KEY=""
else
  if command -v python3 >/dev/null 2>&1; then
    GENERATED_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
  elif command -v openssl >/dev/null 2>&1; then
    GENERATED_KEY=$(openssl rand -base64 32 | tr -d '/+=' | cut -c1-43)
  else
    fail "Need either python3 or openssl to generate an API key"
    exit 1
  fi

  cp .env.example .env
  # Replace the placeholder VALID_API_KEYS line with the generated one.
  if grep -q '^VALID_API_KEYS=' .env; then
    # macOS sed and GNU sed disagree on -i; use a portable approach.
    sed "s|^VALID_API_KEYS=.*|VALID_API_KEYS=[\"$GENERATED_KEY\"]|" .env > .env.tmp \
      && mv .env.tmp .env
  else
    echo "VALID_API_KEYS=[\"$GENERATED_KEY\"]" >> .env
  fi
  ok "Generated API key + wrote .env"
fi

# ─── 3. Stack ──────────────────────────────────────────────────────────────
bold "Bringing up Postgres + Redis + API…"
docker compose up -d --build
ok "Stack is up"

# Wait briefly for the API to be reachable so the user gets a clear signal.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -sSf http://localhost:8000/ >/dev/null 2>&1; then
    ok "API responding on http://localhost:8000"
    break
  fi
  if [ "$i" = "10" ]; then
    note "API not responding yet — check \`docker compose logs api\`"
  fi
  sleep 1
done

# ─── 4. Done ───────────────────────────────────────────────────────────────
echo
bold "Server is ready."
echo
echo "  • API:           http://localhost:8000"
echo "  • Swagger UI:    http://localhost:8000/docs"
echo
bold "Get the browser extension:"
echo "  • Download the latest release zip:"
echo "    https://github.com/Watashi199/PurgeQ/releases/latest"
echo "  • Chrome / Edge / Brave:  use purgeq-<version>.zip"
echo "  • Firefox:                use purgeq-firefox-<version>.zip"
echo "  • Then load it as an unpacked / temporary add-on in your browser."
if [ -n "${GENERATED_KEY}" ]; then
  echo
  bold "Save these in the extension popup → Settings:"
  echo "  • API server URL: http://localhost:8000  (or your LAN IP)"
  echo "  • API key:        $GENERATED_KEY"
  echo "  • Default author: <your name — used when banning from FACEIT cards>"
fi
echo
note "Re-running this script is safe: it keeps your existing .env."
