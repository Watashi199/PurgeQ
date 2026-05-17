/**
 * Content script — highlights banned FACEIT players and exposes inline ban/unban actions.
 * MV3 loads content scripts as classic scripts (no top-level imports), so the
 * minimal subset of i18n strings needed by this file is inlined below rather
 * than imported from ../shared/i18n. The popup uses the full shared module.
 */

type Language = 'en' | 'fr' | 'pt-BR' | 'ru' | 'tr' | 'es' | 'de';

type CsKey =
  | 'banButton' | 'unbanButton' | 'banFormTitle'
  | 'reasonPlaceholder' | 'cancel' | 'confirm' | 'ok'
  | 'unbanConfirmTitle' | 'unbanConfirmMessage'
  | 'failedToUnban' | 'unknownError' | 'setDefaultAuthor'
  | 'reasonLabel' | 'byLabel' | 'bannedByPurgeq' | 'viaLabel';

const CS_STRINGS: Record<Language, Record<CsKey, string>> = {
  en: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: 'Ban {name}',
    reasonPlaceholder: 'Reason (1-250 chars)',
    cancel: 'Cancel', confirm: 'Confirm', ok: 'OK',
    unbanConfirmTitle: 'Unban {name}',
    unbanConfirmMessage: 'This player will no longer be highlighted.',
    failedToUnban: 'Failed to unban', unknownError: 'Unknown error',
    setDefaultAuthor: 'Set a default author in the extension popup → Settings.',
    reasonLabel: 'Reason', byLabel: 'By',
    bannedByPurgeq: 'Banned',
    viaLabel: 'Via',
  },
  fr: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: 'Bannir {name}',
    reasonPlaceholder: 'Raison (1-250 caractères)',
    cancel: 'Annuler', confirm: 'Confirmer', ok: 'OK',
    unbanConfirmTitle: 'Débannir {name}',
    unbanConfirmMessage: 'Ce joueur ne sera plus mis en évidence.',
    failedToUnban: 'Échec du débannissement', unknownError: 'Erreur inconnue',
    setDefaultAuthor: 'Définis un auteur par défaut dans le popup → Paramètres.',
    reasonLabel: 'Raison', byLabel: 'Par',
    bannedByPurgeq: 'Banni',
    viaLabel: 'Via',
  },
  'pt-BR': {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: 'Banir {name}',
    reasonPlaceholder: 'Motivo (1-250 caracteres)',
    cancel: 'Cancelar', confirm: 'Confirmar', ok: 'OK',
    unbanConfirmTitle: 'Desbanir {name}',
    unbanConfirmMessage: 'Este jogador não será mais destacado.',
    failedToUnban: 'Falha ao desbanir', unknownError: 'Erro desconhecido',
    setDefaultAuthor: 'Defina um autor padrão no popup → Configurações.',
    reasonLabel: 'Motivo', byLabel: 'Por',
    bannedByPurgeq: 'Banido',
    viaLabel: 'De',
  },
  ru: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: 'Забанить {name}',
    reasonPlaceholder: 'Причина (1-250 символов)',
    cancel: 'Отмена', confirm: 'Подтвердить', ok: 'OK',
    unbanConfirmTitle: 'Разбанить {name}',
    unbanConfirmMessage: 'Этот игрок больше не будет выделяться.',
    failedToUnban: 'Не удалось разбанить', unknownError: 'Неизвестная ошибка',
    setDefaultAuthor: 'Задайте автора по умолчанию в попапе → Настройки.',
    reasonLabel: 'Причина', byLabel: 'От',
    bannedByPurgeq: 'Забанен',
    viaLabel: 'Из',
  },
  tr: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: '{name} kullanıcısını yasakla',
    reasonPlaceholder: 'Neden (1-250 karakter)',
    cancel: 'İptal', confirm: 'Onayla', ok: 'Tamam',
    unbanConfirmTitle: '{name} yasağını kaldır',
    unbanConfirmMessage: 'Bu oyuncu artık vurgulanmayacak.',
    failedToUnban: 'Yasak kaldırılamadı', unknownError: 'Bilinmeyen hata',
    setDefaultAuthor: 'Eklenti popup → Ayarlar bölümünden varsayılan bir yazar belirleyin.',
    reasonLabel: 'Neden', byLabel: 'Ekleyen',
    bannedByPurgeq: 'Yasaklı',
    viaLabel: 'Şuradan',
  },
  es: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: 'Banear a {name}',
    reasonPlaceholder: 'Motivo (1-250 caracteres)',
    cancel: 'Cancelar', confirm: 'Confirmar', ok: 'OK',
    unbanConfirmTitle: 'Desbanear a {name}',
    unbanConfirmMessage: 'Este jugador ya no se resaltará.',
    failedToUnban: 'No se ha podido desbanear', unknownError: 'Error desconocido',
    setDefaultAuthor: 'Define un autor por defecto en el popup → Ajustes.',
    reasonLabel: 'Motivo', byLabel: 'Por',
    bannedByPurgeq: 'Baneado',
    viaLabel: 'Vía',
  },
  de: {
    banButton: 'Ban', unbanButton: 'Unban',
    banFormTitle: '{name} bannen',
    reasonPlaceholder: 'Grund (1-250 Zeichen)',
    cancel: 'Abbrechen', confirm: 'Bestätigen', ok: 'OK',
    unbanConfirmTitle: '{name} entbannen',
    unbanConfirmMessage: 'Dieser Spieler wird nicht mehr hervorgehoben.',
    failedToUnban: 'Entbannen fehlgeschlagen', unknownError: 'Unbekannter Fehler',
    setDefaultAuthor: 'Setze einen Standard-Autor im Popup → Einstellungen.',
    reasonLabel: 'Grund', byLabel: 'Von',
    bannedByPurgeq: 'Gebannt',
    viaLabel: 'Aus',
  },
};

let currentLanguage: Language = 'en';

function tr(key: CsKey, vars?: Record<string, string | number>): string {
  const dict = CS_STRINGS[currentLanguage] ?? CS_STRINGS.en;
  let str = dict[key] ?? CS_STRINGS.en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return str;
}

function detectLanguage(): Language {
  const code = (typeof navigator !== 'undefined' ? navigator.language : '').toLowerCase();
  if (code.startsWith('fr')) return 'fr';
  if (code.startsWith('pt')) return 'pt-BR';
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('tr')) return 'tr';
  if (code.startsWith('es')) return 'es';
  if (code.startsWith('de')) return 'de';
  return 'en';
}

async function loadLanguage(): Promise<void> {
  try {
    const stored = await chrome.storage.local.get('purgeq_settings');
    const settings = stored['purgeq_settings'];
    currentLanguage = (settings?.language as Language) || detectLanguage();
  } catch {
    currentLanguage = detectLanguage();
  }
}

interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  /**
   * Banlist this entry comes from. Populated by the Supabase-backed SW.
   * Optional for backwards compat with any stale cache from older builds.
   */
  banlist_name?: string;
  banlist_id?: string;
  /** True when this ban lives in the user's own banlist (vs a shared one). */
  is_own?: boolean;
  created_at: string;
  updated_at: string;
}

const SCAN_DEBOUNCE_MS = 250;
const PROCESSED_ATTR = 'data-purgeq-processed';
// Marker on banned cards. Using a data-attribute (not a class) because
// FACEIT re-renders cards with animated frames frequently and React wipes
// our injected className on each re-render. Custom data-* attributes survive.
const BANNED_ATTR = 'data-purgeq-banned';
// FACEIT renders player cards differently across pages. Match-room cards use
// `data-testid="playerCard"`; party/lobby cards use `data-playercard="true"`.
const CARD_SELECTOR = '[data-testid="playerCard"], [data-playercard="true"]';
const NICKNAME_SELECTOR = '[class*="Nickname"]';
const NAME_LINK_SELECTOR = 'a[href*="/players/"]';

let currentBanlist: Map<string, BanlistItem> = new Map();
let scanTimeout: ReturnType<typeof setTimeout> | null = null;

// Track nicknames we've already evaluated so we only request a fresh banlist
// when a *genuinely new* player shows up (avoids spamming on every re-scan).
const seenNicknames = new Set<string>();
let lastRefreshRequestAt = 0;
// Don't ask the service worker for a refresh more than once every 5 s.
const REFRESH_THROTTLE_MS = 5000;

function requestRefreshIfStale() {
  const now = Date.now();
  if (now - lastRefreshRequestAt < REFRESH_THROTTLE_MS) return;
  lastRefreshRequestAt = now;
  try {
    chrome.runtime.sendMessage({ type: 'REFRESH_BANLIST' }, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    // Extension reloaded mid-session — ignore.
  }
}

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
      .querySelectorAll(
        '.purgeq-card-action, .purgeq-banned-row, .purgeq-bg-overlay'
      )
      .forEach((el) => el.remove());
    document.querySelectorAll(`[${BANNED_ATTR}]`).forEach((el) => {
      el.removeAttribute(BANNED_ATTR);
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
  // attribute with real cards but have no Avatar holder — skip them.
  // We match the holder class rather than `img[aria-label="avatar"]` so
  // players without a custom avatar (default placeholder) still qualify.
  if (!card.querySelector('[class*="AvatarHolder"]')) return;
  const nickname = getNicknameFromCard(card);
  if (!nickname) return;

  card.setAttribute(PROCESSED_ATTR, 'true');
  card.dataset.purgeqNickname = nickname;
  if (getComputedStyle(card).position === 'static') {
    card.style.position = 'relative';
  }

  const lower = nickname.toLowerCase();
  const isNewPlayer = !seenNicknames.has(lower);
  seenNicknames.add(lower);

  const banned = isPlayerBanned(nickname);
  if (banned) {
    card.setAttribute(BANNED_ATTR, 'true');
    ensureBgOverlay(card);
    card.appendChild(createUnbanButton(nickname, banned));
  } else {
    card.appendChild(createBanButton(nickname));
    // Someone we've never seen who isn't in our cache might be banned by a
    // teammate since our last sync — pull a fresh list (throttled).
    if (isNewPlayer) requestRefreshIfStale();
  }
}

function ensureBgOverlay(card: HTMLElement) {
  if (card.querySelector('.purgeq-bg-overlay')) return;
  const bg = document.createElement('div');
  bg.className = 'purgeq-bg-overlay';
  card.insertBefore(bg, card.firstChild);
}

function createUnbanButton(nickname: string, ban: BanlistItem): HTMLDivElement {
  const wrap = document.createElement('div');
  wrap.className = 'purgeq-card-action purgeq-banned-row';

  // Left pill: prohibition icon + "Banned by PurgeQ" — purely informational.
  const pill = document.createElement('div');
  pill.className = 'purgeq-banned-pill';
  pill.appendChild(buildProhibitionIcon());
  const label = document.createElement('span');
  label.className = 'purgeq-banned-label';
  label.textContent = tr('bannedByPurgeq');
  pill.appendChild(label);
  attachBanTooltip(pill, ban);
  wrap.appendChild(pill);

  // Right control: the actual unban (trash icon).
  const trash = document.createElement('button');
  trash.type = 'button';
  trash.className = 'purgeq-unban-icon';
  trash.title = tr('unbanConfirmTitle', { name: nickname });
  trash.appendChild(buildTrashIcon());
  trash.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    const ok = await openConfirmDialog(trash, {
      title: tr('unbanConfirmTitle', { name: nickname }),
      message: tr('unbanConfirmMessage'),
      confirmLabel: tr('confirm'),
    });
    if (!ok) return;
    trash.disabled = true;
    const result = await sendAction('REMOVE_BAN', { faceit_name: nickname });
    if (!result.success) {
      trash.disabled = false;
      await openAlertDialog(trash, {
        title: tr('failedToUnban'),
        message: result.error || tr('unknownError'),
      });
    }
  });
  wrap.appendChild(trash);

  return wrap;
}

function attachBanTooltip(target: HTMLElement, ban: BanlistItem) {
  let tipEl: HTMLDivElement | null = null;

  const reposition = () => {
    if (!tipEl) return;
    const rect = target.getBoundingClientRect();
    const tipRect = tipEl.getBoundingClientRect();
    const margin = 8;
    let top = rect.top - tipRect.height - 8;
    let left = rect.left + (rect.width - tipRect.width) / 2;
    if (top < margin) top = rect.bottom + 8;
    if (left < margin) left = margin;
    if (left + tipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tipRect.width - margin;
    }
    tipEl.style.top = `${top}px`;
    tipEl.style.left = `${left}px`;
  };

  const hide = () => {
    if (!tipEl) return;
    tipEl.remove();
    tipEl = null;
    window.removeEventListener('scroll', reposition, true);
    window.removeEventListener('resize', reposition);
  };

  const show = () => {
    if (tipEl) return;
    tipEl = document.createElement('div');
    tipEl.className = 'purgeq-tooltip';

    const reasonRow = document.createElement('div');
    reasonRow.className = 'purgeq-tooltip-reason';
    const reasonLabel = document.createElement('span');
    reasonLabel.className = 'purgeq-tooltip-label';
    reasonLabel.textContent = tr('reasonLabel');
    const reasonVal = document.createElement('span');
    reasonVal.className = 'purgeq-tooltip-value';
    reasonVal.textContent = ban.reason;
    reasonRow.append(reasonLabel, reasonVal);

    const meta = document.createElement('div');
    meta.className = 'purgeq-tooltip-meta';
    const author = document.createElement('span');
    author.className = 'purgeq-tooltip-author';
    author.textContent = `${tr('byLabel')} ${ban.author}`;
    const dot = document.createElement('span');
    dot.className = 'purgeq-tooltip-dot';
    dot.textContent = '·';
    const date = document.createElement('span');
    date.className = 'purgeq-tooltip-date';
    date.textContent = new Date(ban.created_at).toLocaleDateString(currentLanguage);
    meta.append(author, dot, date);

    tipEl.append(reasonRow, meta);

    // Shared-banlist attribution row: only shown when this ban came from a
    // banlist the user does not own (someone shared their list with them).
    if (ban.is_own === false && ban.banlist_name) {
      const source = document.createElement('div');
      source.className = 'purgeq-tooltip-source';
      const sourceLabel = document.createElement('span');
      sourceLabel.className = 'purgeq-tooltip-source-label';
      sourceLabel.textContent = tr('viaLabel');
      const sourceVal = document.createElement('span');
      sourceVal.className = 'purgeq-tooltip-source-value';
      sourceVal.textContent = ban.banlist_name;
      source.append(sourceLabel, sourceVal);
      tipEl.appendChild(source);
    }
    document.body.appendChild(tipEl);
    reposition();
    requestAnimationFrame(() => tipEl?.classList.add('purgeq-tooltip-show'));
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  };

  target.addEventListener('mouseenter', show);
  target.addEventListener('mouseleave', hide);
  target.addEventListener('mousedown', hide);
}

function buildProhibitionIcon(): SVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '9');
  svg.appendChild(circle);
  const slash = document.createElementNS(ns, 'line');
  slash.setAttribute('x1', '5.6');
  slash.setAttribute('y1', '5.6');
  slash.setAttribute('x2', '18.4');
  slash.setAttribute('y2', '18.4');
  svg.appendChild(slash);
  return svg;
}

function buildTrashIcon(): SVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const paths = [
    'M3 6h18',
    'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
    'M10 11v6M14 11v6',
    'M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2',
  ];
  for (const d of paths) {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    svg.appendChild(p);
  }
  return svg;
}

function createBanButton(nickname: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'purgeq-card-action purgeq-card-action-ban';
  btn.title = tr('banFormTitle', { name: nickname });
  btn.appendChild(buildProhibitionIcon());
  const label = document.createElement('span');
  label.textContent = tr('banButton');
  btn.appendChild(label);
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

  const header = document.createElement('div');
  header.className = 'purgeq-form-header';

  const iconWrap = document.createElement('span');
  iconWrap.className = 'purgeq-form-icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.appendChild(buildShieldIcon());

  const titleEl = document.createElement('span');
  titleEl.className = 'purgeq-form-title';
  titleEl.textContent = tr('banFormTitle', { name: nickname });

  header.appendChild(iconWrap);
  header.appendChild(titleEl);
  form.appendChild(header);

  const reason = document.createElement('input');
  reason.type = 'text';
  reason.placeholder = tr('reasonPlaceholder');
  reason.maxLength = 250;
  reason.required = true;
  reason.className = 'purgeq-input';
  form.appendChild(reason);

  const actions = document.createElement('div');
  actions.className = 'purgeq-form-actions';

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = tr('cancel');
  cancel.className = 'purgeq-btn purgeq-btn-secondary';
  cancel.addEventListener('click', (e) => {
    e.stopPropagation();
    closeFloating();
  });

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = tr('confirm');
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
    // Author intentionally omitted — the service worker falls back to the
    // defaultAuthor stored in extension settings.
    const result = await sendAction('ADD_BAN', {
      faceit_name: nickname,
      reason: reason.value.trim(),
    });
    submit.disabled = false;
    if (result.success) {
      closeFloating();
    } else {
      const msg = result.error || tr('unknownError');
      error.textContent = /author/i.test(msg) ? tr('setDefaultAuthor') : msg;
    }
  });

  showFloating(form, anchor);
  reason.focus();
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function buildShieldIcon(): SVGElement {
  // Orange shield outline with a white checkmark inside (no fill).
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');

  const outline = document.createElementNS(SVG_NS, 'path');
  outline.setAttribute('stroke', '#ff5500');
  outline.setAttribute('stroke-width', '2');
  outline.setAttribute('stroke-linecap', 'round');
  outline.setAttribute('stroke-linejoin', 'round');
  outline.setAttribute('d', 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
  svg.appendChild(outline);

  const check = document.createElementNS(SVG_NS, 'path');
  check.setAttribute('stroke', '#ffffff');
  check.setAttribute('stroke-width', '2');
  check.setAttribute('stroke-linecap', 'round');
  check.setAttribute('stroke-linejoin', 'round');
  check.setAttribute('d', 'm8 12 3 3 5-5');
  svg.appendChild(check);

  return svg;
}

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Floating confirmation dialog matching the inline ban form. Resolves to
 * true if the user clicks Confirm, false if they cancel or dismiss.
 */
function openConfirmDialog(
  anchor: HTMLElement,
  opts: DialogOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    const root = buildDialogShell(opts);

    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      closeFloating();
      resolve(value);
    };

    const cancel = makeButton(opts.cancelLabel ?? tr('cancel'), false, () =>
      settle(false)
    );
    const confirm = makeButton(opts.confirmLabel ?? tr('confirm'), true, () =>
      settle(true)
    );
    root.actions.appendChild(cancel);
    root.actions.appendChild(confirm);

    showFloating(root.form, anchor);
    confirm.focus();

    // Floating dismiss (click outside / Escape) counts as cancel.
    const observer = new MutationObserver(() => {
      if (!document.body.contains(root.form)) {
        observer.disconnect();
        settle(false);
      }
    });
    observer.observe(document.body, { childList: true });
  });
}

/**
 * Floating alert dialog with a single OK button. Resolves once the user
 * acknowledges or dismisses it.
 */
function openAlertDialog(
  anchor: HTMLElement,
  opts: DialogOptions
): Promise<void> {
  return new Promise((resolve) => {
    const root = buildDialogShell(opts);

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      closeFloating();
      resolve();
    };

    const ok = makeButton(opts.confirmLabel ?? tr('ok'), true, settle);
    root.actions.appendChild(ok);

    showFloating(root.form, anchor);
    ok.focus();

    const observer = new MutationObserver(() => {
      if (!document.body.contains(root.form)) {
        observer.disconnect();
        settle();
      }
    });
    observer.observe(document.body, { childList: true });
  });
}

function buildDialogShell(opts: DialogOptions): {
  form: HTMLDivElement;
  actions: HTMLDivElement;
} {
  closeFloating();

  const form = document.createElement('div');
  form.className = 'purgeq-floating purgeq-form';
  form.addEventListener('click', (e) => e.stopPropagation());
  form.addEventListener('mousedown', (e) => e.stopPropagation());

  const header = document.createElement('div');
  header.className = 'purgeq-form-header';

  const iconWrap = document.createElement('span');
  iconWrap.className = 'purgeq-form-icon';
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.appendChild(buildShieldIcon());

  const titleEl = document.createElement('span');
  titleEl.className = 'purgeq-form-title';
  titleEl.textContent = opts.title;

  header.appendChild(iconWrap);
  header.appendChild(titleEl);
  form.appendChild(header);

  if (opts.message) {
    const message = document.createElement('div');
    message.className = 'purgeq-form-message';
    message.textContent = opts.message;
    form.appendChild(message);
  }

  const actions = document.createElement('div');
  actions.className = 'purgeq-form-actions';
  form.appendChild(actions);

  return { form, actions };
}

function makeButton(
  label: string,
  primary: boolean,
  onClick: () => void
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.className = `purgeq-btn ${primary ? 'purgeq-btn-primary' : 'purgeq-btn-secondary'}`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return btn;
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
    [data-purgeq-banned="true"] {
      border-radius: 8px;
      /* Thin red rim drawn on top of the card content (FACEIT's children
         have opaque backgrounds that would hide an inset shadow). Outline
         is painted over everything and ignored by layout. */
      outline: 1px solid rgba(220, 50, 50, 0.6) !important;
      outline-offset: -1px !important;
      box-shadow: 0 0 12px rgba(220, 50, 50, 0.18) !important;
      transition: outline-color 0.2s ease-out, box-shadow 0.2s ease-out;
    }

    [data-purgeq-banned="true"]:hover {
      outline-color: rgba(240, 70, 70, 0.95) !important;
      box-shadow: 0 0 16px rgba(240, 70, 70, 0.28) !important;
    }

    [data-purgeq-banned="true"] [class*="Nickname"] {
      color: #ef4444 !important;
    }

    /* Dark-red tint always visible on banned cards.
       Hover bumps saturation a notch. */
    .purgeq-bg-overlay {
      display: none;
    }
    [data-purgeq-banned="true"] .purgeq-bg-overlay {
      display: block;
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      background: linear-gradient(180deg,
        rgba(180, 30, 30, 0.35) 0%,
        rgba(180, 30, 30, 0.10) 35%,
        rgba(180, 30, 30, 0) 70%);
      z-index: 1;
      transition: background 0.2s ease-out;
    }
    [data-purgeq-banned="true"]:hover .purgeq-bg-overlay {
      background: linear-gradient(180deg,
        rgba(210, 40, 40, 0.55) 0%,
        rgba(210, 40, 40, 0.18) 35%,
        rgba(210, 40, 40, 0) 70%);
    }

    [data-testid="playerCard"] > *:not(.purgeq-bg-overlay):not(.purgeq-card-action),
    [data-playercard="true"] > *:not(.purgeq-bg-overlay):not(.purgeq-card-action) {
      position: relative;
      z-index: 2;
    }

    /* ───── Ban button (shown on hover for clean players) ─────
       Same visual language as the banned-row pill: red gradient, 26px tall,
       prohibition icon + label. */
    .purgeq-card-action-ban {
      all: unset;
      box-sizing: border-box;
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 6px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      color: white;
      cursor: pointer;
      font-family: system-ui, sans-serif;
      background: linear-gradient(135deg, #c83232 0%, #8a1818 100%);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(4px);
      transition: transform 0.15s, filter 0.15s, opacity 0.15s;
      z-index: 3;
    }

    [data-testid="playerCard"]:hover .purgeq-card-action-ban,
    [data-playercard="true"]:hover .purgeq-card-action-ban {
      opacity: 1;
      transform: translateY(0);
    }

    .purgeq-card-action-ban:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .purgeq-card-action-ban:active { transform: translateY(0); filter: brightness(0.95); }
    .purgeq-card-action-ban[disabled] { opacity: 0.6; cursor: wait; transform: none; }

    /* ───── Banned row (info pill + trash icon) ───── */
    .purgeq-banned-row {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 6px;
      display: flex;
      gap: 6px;
      align-items: stretch;
      z-index: 3;
      font-family: system-ui, sans-serif;
    }

    .purgeq-banned-pill {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 8px;
      height: 26px;
      border-radius: 6px;
      background: linear-gradient(135deg, #c83232 0%, #8a1818 100%);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.3);
      user-select: none;
    }

    .purgeq-banned-label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .purgeq-unban-icon {
      all: unset;
      box-sizing: border-box;
      width: 26px;
      height: 26px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      background: rgba(20, 20, 24, 0.85);
      color: #d4d4d8;
      cursor: pointer;
      transition: background 0.15s, color 0.15s, filter 0.15s;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    }
    .purgeq-unban-icon:hover {
      background: #ef4444;
      color: #fff;
    }
    .purgeq-unban-icon:active { filter: brightness(0.9); }
    .purgeq-unban-icon[disabled] { opacity: 0.55; cursor: wait; }

    .purgeq-floating {
      position: fixed;
      min-width: 300px;
      max-width: 360px;
      background: #17171a;
      color: #f5f5f7;
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04);
      border: 1px solid #25252a;
      z-index: 2147483647;
    }

    .purgeq-form-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .purgeq-form-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #ff5500;
    }

    .purgeq-form-title {
      font-weight: 700;
      font-size: 16px;
      letter-spacing: 0.1px;
      color: #f5f5f7;
    }

    .purgeq-input {
      display: block;
      width: 100%;
      padding: 11px 13px;
      margin-bottom: 20px;
      border: 1px solid #2a2a30;
      background: #0e0e10;
      color: #f5f5f7;
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      box-sizing: border-box;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .purgeq-input::placeholder { color: #6b6b72; }

    .purgeq-input:focus {
      border-color: #ff5500;
      box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.18);
    }

    .purgeq-form-message {
      font-size: 13px;
      line-height: 1.5;
      color: #a3a3a8;
      margin-bottom: 16px;
    }

    .purgeq-form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .purgeq-btn {
      padding: 9px 18px;
      border: 1px solid transparent;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: filter 0.15s, transform 0.1s, background 0.15s;
    }

    .purgeq-btn:hover:not(:disabled) { filter: brightness(1.08); }
    .purgeq-btn:active:not(:disabled) { transform: translateY(1px); }

    .purgeq-btn-primary {
      background: linear-gradient(135deg, #ff5500 0%, #cc3a00 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 85, 0, 0.35);
    }
    .purgeq-btn-secondary {
      background: #1d1d21;
      color: #f5f5f7;
      border-color: #2a2a30;
    }
    .purgeq-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .purgeq-form-error {
      color: #fca5a5;
      font-size: 11.5px;
    }
    .purgeq-form-error:not(:empty) {
      margin-top: 10px;
    }

    /* ───── Custom hover tooltip on banned pill ───── */
    .purgeq-tooltip {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 2147483647;
      max-width: 280px;
      padding: 9px 12px 10px;
      background: linear-gradient(180deg, #1c1c20 0%, #131316 100%);
      color: #f5f5f7;
      border: 1px solid #2a2a30;
      border-radius: 8px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55),
                  0 0 0 1px rgba(255, 255, 255, 0.03);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      letter-spacing: 0.1px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(2px);
      transition: opacity 120ms ease, transform 120ms ease;
      white-space: normal;
      word-break: break-word;
    }
    .purgeq-tooltip.purgeq-tooltip-show {
      opacity: 1;
      transform: translateY(0);
    }
    .purgeq-tooltip-reason {
      display: block;
    }
    .purgeq-tooltip-label {
      display: inline-block;
      margin-right: 6px;
      font-weight: 700;
      font-size: 10.5px;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #ff7a4d;
    }
    .purgeq-tooltip-value {
      color: #ececf0;
    }
    .purgeq-tooltip-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 11px;
      color: #9a9aa3;
    }
    .purgeq-tooltip-author {
      max-width: 160px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .purgeq-tooltip-dot {
      color: #5a5a62;
    }
    .purgeq-tooltip-date {
      color: #c5c5cc;
      font-variant-numeric: tabular-nums;
    }
    .purgeq-tooltip-source {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 10.5px;
      letter-spacing: 0.4px;
      color: #8d8d96;
    }
    .purgeq-tooltip-source-label {
      text-transform: uppercase;
      font-weight: 700;
      color: #ff7a4d;
      opacity: 0.85;
    }
    .purgeq-tooltip-source-value {
      color: #d4d4dc;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
  document.head.appendChild(style);
}

async function initialize() {
  await loadLanguage();
  injectStyles();
  await loadBanlist(false);
  scanCards();
  setupMutationObserver();

  chrome.runtime.onMessage.addListener((request) => {
    if (request?.type === 'BANLIST_UPDATED') {
      loadBanlist(true);
    }
  });

  // Pick up live language changes from the popup so the next ban/unban
  // form shows the user's new pick without a page reload.
  chrome.storage.onChanged.addListener((changes) => {
    const next = changes['purgeq_settings']?.newValue?.language as
      | Language
      | undefined;
    if (next && next !== currentLanguage) {
      currentLanguage = next;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
