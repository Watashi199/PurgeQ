/**
 * Content script — highlights banned FACEIT players and exposes inline ban/unban actions.
 * Self-contained: no shared imports (content scripts in MV3 don't reliably support modules).
 */

interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const SCAN_DEBOUNCE_MS = 250;
const PROCESSED_ATTR = 'data-purgeq-processed';
// FACEIT renders player cards differently across pages. Match-room cards use
// `data-testid="playerCard"`; party/lobby cards use `data-playercard="true"`.
const CARD_SELECTOR = '[data-testid="playerCard"], [data-playercard="true"]';
const NICKNAME_SELECTOR = '[class*="Nickname"]';
const NAME_LINK_SELECTOR = 'a[href*="/players/"]';

let currentBanlist: Map<string, BanlistItem> = new Map();
let scanTimeout: ReturnType<typeof setTimeout> | null = null;

function isPlayerBanned(name: string): BanlistItem | null {
  return currentBanlist.get(name.toLowerCase()) || null;
}

function validateFaceitName(name: string): boolean {
  return /^[A-Za-z0-9_-]{2,32}$/.test(name);
}

async function fetchBanlistViaBackground(): Promise<Map<string, BanlistItem>> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_BANLIST' }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          console.error(
            '[PurgeQ] GET_BANLIST failed:',
            chrome.runtime.lastError?.message || response?.error
          );
          resolve(new Map());
          return;
        }
        const entries = Object.entries(
          (response.data || {}) as Record<string, BanlistItem>
        );
        resolve(new Map(entries));
      });
    } catch (error) {
      console.error('[PurgeQ] sendMessage failed:', error);
      resolve(new Map());
    }
  });
}

function sendAction(
  type: 'ADD_BAN' | 'REMOVE_BAN',
  payload: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: 'No response' });
    });
  });
}

async function loadBanlist(refreshDom = true) {
  currentBanlist = await fetchBanlistViaBackground();
  if (refreshDom) {
    document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach((el) => {
      el.removeAttribute(PROCESSED_ATTR);
    });
    document
      .querySelectorAll('.purgeq-card-action, .purgeq-bg-overlay')
      .forEach((el) => el.remove());
    document.querySelectorAll('.purgeq-banned-card').forEach((el) => {
      el.classList.remove('purgeq-banned-card');
    });
    scanCards();
  }
}

function getNicknameFromCard(card: HTMLElement): string | null {
  const nameEl = card.querySelector<HTMLElement>(NICKNAME_SELECTOR);
  const fromText = nameEl?.textContent?.trim();
  if (fromText && validateFaceitName(fromText)) return fromText;

  const link = card.querySelector<HTMLAnchorElement>(NAME_LINK_SELECTOR);
  const href = link?.getAttribute('href') || '';
  const match = href.match(/\/players\/([^/?#]+)/);
  if (match) {
    const decoded = decodeURIComponent(match[1]);
    if (validateFaceitName(decoded)) return decoded;
  }
  return null;
}

function scanCards() {
  const cards = document.querySelectorAll<HTMLElement>(CARD_SELECTOR);
  cards.forEach(processCard);
}

function processCard(card: HTMLElement) {
  if (card.getAttribute(PROCESSED_ATTR)) return;
  // Empty "invite players" slots on party pages share the data-playercard
  // attribute with real cards but have no avatar — skip them.
  if (!card.querySelector('img[aria-label="avatar"]')) return;
  const nickname = getNicknameFromCard(card);
  if (!nickname) return;

  card.setAttribute(PROCESSED_ATTR, 'true');
  card.dataset.purgeqNickname = nickname;
  if (getComputedStyle(card).position === 'static') {
    card.style.position = 'relative';
  }

  const banned = isPlayerBanned(nickname);
  if (banned) {
    card.classList.add('purgeq-banned-card');
    ensureBgOverlay(card);
    card.appendChild(createUnbanButton(nickname, banned));
  } else {
    card.appendChild(createBanButton(nickname));
  }
}

function ensureBgOverlay(card: HTMLElement) {
  if (card.querySelector('.purgeq-bg-overlay')) return;
  const bg = document.createElement('div');
  bg.className = 'purgeq-bg-overlay';
  card.insertBefore(bg, card.firstChild);
}

function createUnbanButton(nickname: string, ban: BanlistItem): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'purgeq-card-action purgeq-card-action-unban';
  btn.textContent = '♻ Unban';
  btn.title = `Banned: ${ban.reason}\nBy: ${ban.author}\n${new Date(
    ban.created_at
  ).toLocaleDateString()}\n\nClick to remove from banlist`;
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm(`Remove ${nickname} from banlist?`)) return;
    btn.disabled = true;
    const result = await sendAction('REMOVE_BAN', { faceit_name: nickname });
    if (!result.success) {
      alert(`PurgeQ: ${result.error || 'failed to remove ban'}`);
      btn.disabled = false;
    }
  });
  return btn;
}

function createBanButton(nickname: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'purgeq-card-action purgeq-card-action-ban';
  btn.textContent = '🚫 Ban';
  btn.title = `Ban ${nickname}`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    openBanForm(btn, nickname);
  });
  return btn;
}

function openBanForm(anchor: HTMLElement, nickname: string) {
  closeFloating();

  const form = document.createElement('form');
  form.className = 'purgeq-floating purgeq-form';
  form.addEventListener('click', (e) => e.stopPropagation());
  form.addEventListener('mousedown', (e) => e.stopPropagation());

  const title = document.createElement('div');
  title.className = 'purgeq-form-title';
  title.textContent = `Ban ${nickname}`;
  form.appendChild(title);

  const reason = document.createElement('input');
  reason.type = 'text';
  reason.placeholder = 'Reason (1-250 chars)';
  reason.maxLength = 250;
  reason.required = true;
  reason.className = 'purgeq-input';
  form.appendChild(reason);

  const author = document.createElement('input');
  author.type = 'text';
  author.placeholder = 'Author (defaults to settings)';
  author.maxLength = 32;
  author.className = 'purgeq-input';
  form.appendChild(author);

  const actions = document.createElement('div');
  actions.className = 'purgeq-form-actions';

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.className = 'purgeq-btn purgeq-btn-secondary';
  cancel.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFloating();
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Confirm';
  submit.className = 'purgeq-btn purgeq-btn-primary';

  actions.appendChild(cancel);
  actions.appendChild(submit);
  form.appendChild(actions);

  const error = document.createElement('div');
  error.className = 'purgeq-form-error';
  form.appendChild(error);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    submit.disabled = true;
    const result = await sendAction('ADD_BAN', {
      faceit_name: nickname,
      reason: reason.value.trim(),
      author: author.value.trim(),
    });
    submit.disabled = false;
    if (result.success) {
      closeFloating();
    } else {
      error.textContent = result.error || 'Failed to add ban';
    }
  });

  showFloating(form, anchor);
  reason.focus();
}

let floatingDismiss: ((ev: Event) => void) | null = null;
let floatingReposition: (() => void) | null = null;

function closeFloating() {
  document.querySelectorAll('.purgeq-floating').forEach((el) => el.remove());
  if (floatingDismiss) {
    document.removeEventListener('click', floatingDismiss, { capture: true });
    document.removeEventListener('keydown', floatingDismiss as EventListener);
    floatingDismiss = null;
  }
  if (floatingReposition) {
    window.removeEventListener('scroll', floatingReposition, true);
    window.removeEventListener('resize', floatingReposition);
    floatingReposition = null;
  }
}

function showFloating(el: HTMLElement, anchor: HTMLElement) {
  document.body.appendChild(el);

  const position = () => {
    const rect = anchor.getBoundingClientRect();
    const margin = 6;
    const elRect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.right - elRect.width;
    if (left < margin) left = rect.left;
    if (left + elRect.width > vw - margin) left = vw - elRect.width - margin;
    if (left < margin) left = margin;

    let top = rect.bottom + margin;
    if (top + elRect.height > vh - margin) {
      const above = rect.top - elRect.height - margin;
      if (above >= margin) top = above;
      else top = Math.max(margin, vh - elRect.height - margin);
    }

    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  };

  position();
  requestAnimationFrame(position);

  floatingReposition = position;
  window.addEventListener('scroll', position, true);
  window.addEventListener('resize', position);

  setTimeout(() => {
    floatingDismiss = (ev: Event) => {
      if (ev instanceof KeyboardEvent) {
        if (ev.key === 'Escape') closeFloating();
        return;
      }
      const target = ev.target as Node | null;
      if (target && (el.contains(target) || anchor.contains(target))) return;
      closeFloating();
    };
    document.addEventListener('click', floatingDismiss, { capture: true });
    document.addEventListener('keydown', floatingDismiss as EventListener);
  }, 0);
}

function setupMutationObserver() {
  const observer = new MutationObserver(() => {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanCards, SCAN_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function injectStyles() {
  if (document.getElementById('purgeq-styles')) return;
  const style = document.createElement('style');
  style.id = 'purgeq-styles';
  style.textContent = `
    .purgeq-banned-card {
      outline: 2px solid #ef4444 !important;
      outline-offset: 2px;
      border-radius: 8px;
      box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25), 0 0 24px rgba(239, 68, 68, 0.45) !important;
      animation: purgeq-pulse 2.4s ease-in-out infinite;
    }

    @keyframes purgeq-pulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25), 0 0 20px rgba(239, 68, 68, 0.4); }
      50% { box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5), 0 0 32px rgba(239, 68, 68, 0.7); }
    }

    .purgeq-banned-card [class*="Nickname"] {
      color: #ef4444 !important;
    }

    .purgeq-bg-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      background:
        linear-gradient(160deg, rgba(239, 68, 68, 0.45) 0%, rgba(127, 29, 29, 0.25) 50%, rgba(239, 68, 68, 0.5) 100%);
      mix-blend-mode: multiply;
      z-index: 1;
    }

    [data-testid="playerCard"] > *:not(.purgeq-bg-overlay):not(.purgeq-card-action),
    [data-playercard="true"] > *:not(.purgeq-bg-overlay):not(.purgeq-card-action) {
      position: relative;
      z-index: 2;
    }

    .purgeq-card-action {
      all: unset;
      box-sizing: border-box;
      position: absolute;
      left: 10px;
      right: 10px;
      bottom: 6px;
      height: 22px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: white;
      cursor: pointer;
      font-family: system-ui, sans-serif;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
      transition: transform 0.15s, filter 0.15s, opacity 0.15s;
      z-index: 3;
    }

    .purgeq-card-action-ban {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      opacity: 0;
      transform: translateY(4px);
    }

    [data-testid="playerCard"]:hover .purgeq-card-action-ban,
    [data-playercard="true"]:hover .purgeq-card-action-ban {
      opacity: 1;
      transform: translateY(0);
    }

    .purgeq-card-action-unban {
      background: linear-gradient(135deg, #22c55e 0%, #15803d 100%);
    }

    .purgeq-card-action:hover { filter: brightness(1.12); transform: translateY(-1px); }
    .purgeq-card-action:active { transform: translateY(0); filter: brightness(0.95); }
    .purgeq-card-action[disabled] { opacity: 0.6; cursor: wait; transform: none; }

    .purgeq-floating {
      position: fixed;
      min-width: 240px;
      max-width: 320px;
      background: #1f2937;
      color: #f3f4f6;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      border: 1px solid #374151;
      z-index: 2147483647;
    }

    .purgeq-form-title {
      font-weight: 700;
      margin-bottom: 6px;
      font-size: 13px;
    }

    .purgeq-input {
      display: block;
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 6px;
      border: 1px solid #374151;
      background: #111827;
      color: #f3f4f6;
      border-radius: 4px;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      box-sizing: border-box;
    }

    .purgeq-form-actions {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
    }

    .purgeq-btn {
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      font-family: system-ui, sans-serif;
    }

    .purgeq-btn-primary { background: #ef4444; color: white; }
    .purgeq-btn-secondary { background: #374151; color: #f3f4f6; }
    .purgeq-btn:disabled { opacity: 0.6; cursor: wait; }

    .purgeq-form-error {
      color: #fca5a5;
      font-size: 11px;
      margin-top: 6px;
      min-height: 14px;
    }
  `;
  document.head.appendChild(style);
}

async function initialize() {
  injectStyles();
  await loadBanlist(false);
  scanCards();
  setupMutationObserver();

  chrome.runtime.onMessage.addListener((request) => {
    if (request?.type === 'BANLIST_UPDATED') {
      loadBanlist(true);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
