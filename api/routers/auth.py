"""Auth router: Discord-OAuth-driven signup/recovery for multi-tenant mode."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import discord
from api.core import get_db_session, get_settings

settings = get_settings()
router = APIRouter(tags=["auth"])


def _disabled_response() -> HTMLResponse:
    return HTMLResponse(
        _PAGE.format(
            title="Signup unavailable",
            body=(
                "<p>This server is running in self-hosted mode. "
                "Use the API key from your <code>.env</code> "
                "instead of signing up.</p>"
            ),
        ),
        status_code=status.HTTP_404_NOT_FOUND,
    )


@router.get("/signup", response_class=HTMLResponse)
async def signup_page() -> HTMLResponse:
    """Render the public signup landing page."""
    if not discord.is_configured():
        return _disabled_response()
    return HTMLResponse(_SIGNUP_PAGE)


@router.get("/auth/discord/login")
async def discord_login() -> RedirectResponse:
    """Kick off the Discord OAuth flow."""
    if not discord.is_configured():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    state = await discord.issue_state()
    return RedirectResponse(
        url=discord.build_authorize_url(state),
        status_code=status.HTTP_302_FOUND,
    )


@router.get("/auth/discord/callback", response_class=HTMLResponse)
async def discord_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db_session)],
    code: str = Query(...),
    state: str = Query(...),
) -> HTMLResponse:
    """Discord redirects here with a one-time code; exchange and show the key."""
    if not discord.is_configured():
        return _disabled_response()

    if not await discord.consume_state(state):
        return HTMLResponse(
            _PAGE.format(
                title="Login expired",
                body=(
                    "<p>That login link has expired or was already used. "
                    "<a href=\"/signup\">Try again</a>.</p>"
                ),
            ),
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    new_key = await discord.claim_or_create_key(db, code)
    if not new_key:
        return HTMLResponse(
            _PAGE.format(
                title="Login failed",
                body=(
                    "<p>We couldn't reach Discord or the response was unexpected. "
                    "<a href=\"/signup\">Try again</a>.</p>"
                ),
            ),
            status_code=status.HTTP_502_BAD_GATEWAY,
        )

    return HTMLResponse(_render_key_page(new_key))


_PAGE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>{title} — PurgeQ</title>
<style>
:root {{
  --orange:#ff5500;--orange-light:#ff7a46;--orange-dark:#cc3a00;
  --bg:#060606;--surface:#111;--border:#2a2a2a;--text:#f5f5f5;--muted:#a3a3a3;
}}
* {{ box-sizing: border-box; }}
body {{
  margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;
  background:radial-gradient(circle at 20% 0%, rgba(255,85,0,.18), transparent 60%) #060606;
  color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
}}
.card {{ background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:32px;max-width:520px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.5); }}
h1 {{ font-size:22px;margin:0 0 16px;background:linear-gradient(135deg,var(--orange-light),var(--orange));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent; }}
p {{ color:var(--muted);line-height:1.5;margin:0 0 16px; }}
a {{ color:var(--orange);text-decoration:none; }}
a:hover {{ text-decoration:underline; }}
.btn {{ display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:8px;font-weight:700;cursor:pointer;border:none;background:linear-gradient(135deg,#5865F2,#4752C4);color:#fff;text-decoration:none;font-size:14px; }}
.btn:hover {{ filter:brightness(1.1);text-decoration:none; }}
.key {{ font-family:ui-monospace,Menlo,Consolas,monospace;background:#000;border:1px solid var(--border);padding:14px;border-radius:8px;word-break:break-all;font-size:13px;color:var(--orange-light); }}
.warn {{ background:rgba(255,85,0,.08);border-left:3px solid var(--orange);padding:12px;border-radius:4px;margin:16px 0;font-size:12px;color:#fca5a5; }}
button.copy {{ margin-top:8px;padding:6px 12px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:6px;cursor:pointer;font-size:12px; }}
button.copy:hover {{ border-color:var(--orange); }}
</style>
</head><body>
<div class="card">
<h1>{title}</h1>
{body}
</div>
</body></html>"""

_SIGNUP_PAGE = _PAGE.format(
    title="Get your PurgeQ key",
    body=(
        "<p>Sign in with Discord to get an API key. The key is what you'll paste"
        " into the PurgeQ extension; it scopes a private banlist that only you"
        " (and people you share the key with) can read or write.</p>"
        "<p>If you ever lose the key, just sign in with Discord again — we'll"
        " issue a new one and invalidate the old one. The recovery is the"
        " login.</p>"
        '<a class="btn" href="/auth/discord/login">'
        '<svg width="20" height="20" viewBox="0 0 71 55" fill="currentColor">'
        '<path d="M60.1 4.9A58.5 58.5 0 0 0 45.6 0c-.6 1.1-1.4 2.6-1.9 3.8a54 54 0 0 0-16.4 0c-.5-1.2-1.3-2.7-1.9-3.8A58.5 58.5 0 0 0 10.9 4.9C1.6 18.7-1 32.2.4 45.4a59 59 0 0 0 18.1 9.2 44 44 0 0 0 3.9-6.3c-2.1-.8-4-1.8-5.9-2.9.5-.4 1-.7 1.4-1.1a42 42 0 0 0 35.3 0c.5.4 1 .7 1.4 1.1a39 39 0 0 1-5.9 2.9 44 44 0 0 0 3.9 6.3 59 59 0 0 0 18.1-9.2c1.6-15.4-2.7-28.7-10.6-40.5zM23.7 37.3c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.4 3.3 6.4 7.3-2.8 7.3-6.4 7.3zm23.6 0c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.4 3.3 6.4 7.3-2.8 7.3-6.4 7.3z"/>'
        "</svg>Sign in with Discord</a>"
    ),
)


def _render_key_page(api_key: str) -> str:
    """Render the post-OAuth key reveal page.

    Built per-request so we can use a vanilla str.format on the outer
    template once (the inserted body just appears verbatim, even if it
    contains things that look like format placeholders).
    """
    # `api_key` was generated by `secrets.token_urlsafe`, so it's
    # alphanumeric + `-_`; no HTML escaping is required, but any future
    # source of input here would need it.
    body = (
        "<p>Copy this into the PurgeQ extension under "
        "<strong>Settings → API key</strong>:</p>"
        f'<div class="key" id="k">{api_key}</div>'
        '<button class="copy" onclick="navigator.clipboard.writeText('
        "document.getElementById('k').textContent);this.textContent='Copied!'\">"
        "Copy to clipboard</button>"
        '<div class="warn">This key is shown <strong>only this once</strong>. '
        "Save it now. If you lose it, just sign in with Discord again to get "
        "a new one — the previous key will stop working.</div>"
    )
    return _PAGE.format(title="Your API key is ready", body=body)
