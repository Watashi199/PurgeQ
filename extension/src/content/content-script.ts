/**
 * Content script for detecting FACEIT player names on the page
 */

// Self-contained: content scripts in MV3 don't reliably support ES module imports,
// so we duplicate the small types/helpers we need instead of pulling in shared chunks.
interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  created_at: string;
  updated_at: string;
}

function isPlayerBanned(
  playerName: string,
  banlist: Map<string, BanlistItem>
): BanlistItem | null {
  return banlist.get(playerName.toLowerCase()) || null;
}

async function fetchBanlistViaBackground(): Promise<Map<string, BanlistItem>> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage({ type: 'GET_BANLIST' }, (response) => {
        if (chrome.runtime.lastError || !response?.success) {
          console.error(
            'GET_BANLIST failed:',
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
      console.error('sendMessage failed:', error);
      resolve(new Map());
    }
  });
}

const SCAN_DEBOUNCE_MS = 300;
const PLAYER_SELECTORS = [
  '[class*="player"]',
  '[class*="nickname"]',
  'a[href*="faceit.com/players/"]',
  '[data-player-id]',
];

let currentBanlist: Map<string, BanlistItem> | null = null;
let scanTimeout: ReturnType<typeof setTimeout> | null = null;

async function initialize() {
  console.log('PurgeQ content script initialized');

  await loadBanlist();
  setupMutationObserver();

  chrome.runtime.onMessage.addListener((request) => {
    if (request?.type === 'BANLIST_UPDATED') {
      loadBanlist();
    }
  });
}

async function loadBanlist() {
  try {
    currentBanlist = await fetchBanlistViaBackground();
    scanPlayerNames();
  } catch (error) {
    console.error('Failed to load banlist:', error);
  }
}

function setupMutationObserver() {
  const observer = new MutationObserver(() => {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(scanPlayerNames, SCAN_DEBOUNCE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
}

function scanPlayerNames() {
  if (!currentBanlist) return;

  for (const selector of PLAYER_SELECTORS) {
    const elements = document.querySelectorAll<HTMLElement>(selector);

    elements.forEach((element) => {
      if (element.classList.contains('purgeq-checked')) return;
      element.classList.add('purgeq-checked');

      const playerName = extractPlayerName(element);
      if (!playerName) return;

      const bannedItem = isPlayerBanned(playerName, currentBanlist!);
      if (bannedItem) {
        markPlayerAsBanned(element, bannedItem);
      }
    });
  }
}

function extractPlayerName(element: Element): string | null {
  const text = element.textContent?.trim();
  const title = element.getAttribute('title');
  const href = element.getAttribute('href');
  const dataAttr = element.getAttribute('data-player-name');

  if (href && href.includes('/players/')) {
    const match = href.match(/\/players\/([^/?]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  if (dataAttr) return dataAttr;
  if (title && title.length > 0 && title.length <= 32) return title;
  if (text && validateFaceitName(text)) return text;

  return null;
}

function validateFaceitName(name: string): boolean {
  return /^[A-Za-z0-9_-]{2,32}$/.test(name);
}

function markPlayerAsBanned(element: HTMLElement, banItem: BanlistItem) {
  const oldBadge = element.querySelector('.purgeq-badge');
  if (oldBadge) oldBadge.remove();

  const badge = document.createElement('span');
  badge.className = 'purgeq-badge';
  badge.textContent = '🚫';
  badge.title = `Banned: ${banItem.reason}\nAuthor: ${banItem.author}`;
  badge.style.cssText = `
    display: inline-block;
    background-color: #ef4444;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    line-height: 20px;
    text-align: center;
    font-size: 12px;
    margin-left: 4px;
    cursor: pointer;
    font-weight: bold;
    flex-shrink: 0;
  `;

  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showBanTooltip(element, banItem);
  });

  element.style.opacity = '0.7';
  element.classList.add('purgeq-banned-player');

  element.appendChild(badge);
}

function showBanTooltip(element: HTMLElement, banItem: BanlistItem) {
  const oldTooltip = document.querySelector('.purgeq-tooltip');
  if (oldTooltip) oldTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'purgeq-tooltip';
  Object.assign(tooltip.style, {
    background: '#1f2937',
    color: 'white',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    zIndex: '10000',
    maxWidth: '250px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    position: 'fixed',
  });

  const title = document.createElement('div');
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '4px';
  title.textContent = banItem.faceit_name;
  tooltip.appendChild(title);

  tooltip.appendChild(buildTooltipRow('Reason: ', banItem.reason));
  tooltip.appendChild(buildTooltipRow('By: ', banItem.author));
  tooltip.appendChild(
    buildTooltipRow('Date: ', new Date(banItem.created_at).toLocaleDateString())
  );

  document.body.appendChild(tooltip);

  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.right + 10}px`;
  tooltip.style.top = `${rect.top}px`;

  setTimeout(() => {
    document.addEventListener('click', () => tooltip.remove(), { once: true });
  }, 0);
}

function buildTooltipRow(label: string, value: string): HTMLDivElement {
  const row = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = label;
  row.appendChild(strong);
  row.appendChild(document.createTextNode(value));
  return row;
}

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .purgeq-banned-player {
      filter: brightness(0.8);
    }

    .purgeq-badge {
      animation: purgeq-pulse 2s infinite;
    }

    @keyframes purgeq-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `;
  document.head.appendChild(style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    initialize();
  });
} else {
  injectStyles();
  initialize();
}
