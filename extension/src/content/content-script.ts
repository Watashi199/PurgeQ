/**
 * Content script for detecting FACEIT player names on the page
 */

import { getBanlist, isPlayerBanned } from '../shared/utils';

// Store current banlist
let currentBanlist: Map<string, any> | null = null;

// Initialize
async function initialize() {
  console.log('PurgeQ content script initialized');
  
  // Load initial banlist
  await loadBanlist();
  
  // Observe DOM changes
  setupMutationObserver();
  
  // Listen for banlist updates from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'BANLIST_UPDATED') {
      loadBanlist();
    }
  });
}

/**
 * Load banlist from background
 */
async function loadBanlist() {
  try {
    currentBanlist = await getBanlist();
    // Scan existing players on page
    scanPlayerNames();
  } catch (error) {
    console.error('Failed to load banlist:', error);
  }
}

/**
 * Setup MutationObserver to detect new player names
 */
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive processing
    clearTimeout((window as any).purgeq_scan_timeout);
    (window as any).purgeq_scan_timeout = setTimeout(() => {
      scanPlayerNames();
    }, 300);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: false,
  });
}

/**
 * Scan page for player names and mark banned ones
 */
function scanPlayerNames() {
  if (!currentBanlist) return;

  // FACEIT-specific selectors for player names
  const playerSelectors = [
    '[class*="player"]',
    '[class*="nickname"]',
    'a[href*="faceit.com/players/"]',
    '[data-player-id]',
  ];

  for (const selector of playerSelectors) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element) => {
      if (element.classList.contains('purgeq-checked')) return; // Skip already checked
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

/**
 * Extract player name from element
 */
function extractPlayerName(element: Element): string | null {
  // Try various methods to extract player name
  const text = element.textContent?.trim();
  const title = element.getAttribute('title');
  const href = element.getAttribute('href');
  const dataAttr = element.getAttribute('data-player-name');

  // From href like /players/playername
  if (href && href.includes('/players/')) {
    const match = href.match(/\/players\/([^/?]+)/);
    if (match) return match[1];
  }

  // Direct attributes
  if (dataAttr) return dataAttr;
  if (title && title.length > 0 && title.length <= 32) return title;

  // Text content (validate FACEIT name format)
  if (text && validateFaceitName(text)) return text;

  return null;
}

/**
 * Validate FACEIT name format
 */
function validateFaceitName(name: string): boolean {
  // FACEIT names: 2-32 chars, alphanumeric + - _
  return /^[A-Za-z0-9_-]{2,32}$/.test(name);
}

/**
 * Mark player as banned
 */
function markPlayerAsBanned(element: Element, banItem: any) {
  // Remove old badge if exists
  const oldBadge = element.querySelector('.purgeq-badge');
  if (oldBadge) oldBadge.remove();

  // Create badge
  const badge = document.createElement('span');
  badge.className = 'purgeq-badge';
  badge.innerHTML = '🚫';
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

  // Add click handler for tooltip
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    showBanTooltip(element, banItem);
  });

  // Add red highlight to element
  element.style.opacity = '0.7';
  element.classList.add('purgeq-banned-player');

  // Insert badge
  element.appendChild(badge);
}

/**
 * Show ban information tooltip
 */
function showBanTooltip(element: Element, banItem: any) {
  // Remove old tooltip
  const oldTooltip = document.querySelector('.purgeq-tooltip');
  if (oldTooltip) oldTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.className = 'purgeq-tooltip';
  tooltip.innerHTML = `
    <div style="
      background: #1f2937;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      z-index: 10000;
      max-width: 250px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    ">
      <div style="font-weight: bold; margin-bottom: 4px;">${banItem.faceit_name}</div>
      <div><strong>Reason:</strong> ${banItem.reason}</div>
      <div><strong>By:</strong> ${banItem.author}</div>
      <div><strong>Date:</strong> ${new Date(banItem.created_at).toLocaleDateString()}</div>
    </div>
  `;

  document.body.appendChild(tooltip);

  // Position tooltip near element
  const rect = (element as HTMLElement).getBoundingClientRect();
  tooltip.style.position = 'fixed';
  tooltip.style.left = rect.right + 10 + 'px';
  tooltip.style.top = rect.top + 'px';

  // Remove on click outside
  setTimeout(() => {
    document.addEventListener(
      'click',
      () => tooltip.remove(),
      { once: true }
    );
  }, 0);
}

// Inject CSS styles
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

// Initialize on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    initialize();
  });
} else {
  injectStyles();
  initialize();
}
