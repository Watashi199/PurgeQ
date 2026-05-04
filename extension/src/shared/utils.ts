/**
 * Shared utilities for extension
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';
export const CACHE_KEY = 'purgeq_banlist_cache';
export const CACHE_TTL = 3600000; // 1 hour in ms
export const REFRESH_INTERVAL = 60000; // 60 seconds in ms

export interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface CachedBanlist {
  timestamp: number;
  data: Map<string, BanlistItem>;
}

/**
 * Get cached banlist or fetch from API
 */
export async function getBanlist(): Promise<Map<string, BanlistItem>> {
  const cached = await getCachedBanlist();

  if (cached && !isCacheExpired(cached)) {
    return cached.data;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/banlist`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const banlistMap = new Map<string, BanlistItem>();

    data.items.forEach((item: BanlistItem) => {
      banlistMap.set(item.faceit_name.toLowerCase(), item);
    });

    // Cache the result
    await setCachedBanlist({
      timestamp: Date.now(),
      data: Object.fromEntries(banlistMap),
    });

    return banlistMap;
  } catch (error) {
    console.error('Failed to fetch banlist:', error);
    // Return cached data as fallback
    const fallback = await getCachedBanlist();
    return fallback ? fallback.data : new Map();
  }
}

/**
 * Check if player is banned
 */
export function isPlayerBanned(
  playerName: string,
  banlist: Map<string, BanlistItem>
): BanlistItem | null {
  const key = playerName.toLowerCase();
  return banlist.get(key) || null;
}

/**
 * Get cached banlist from storage
 */
export async function getCachedBanlist(): Promise<CachedBanlist | null> {
  try {
    const stored = await chrome.storage.local.get(CACHE_KEY);
    if (!stored[CACHE_KEY]) return null;

    const data = stored[CACHE_KEY];
    return {
      timestamp: data.timestamp,
      data: new Map(Object.entries(data.data)) as Map<string, BanlistItem>,
    };
  } catch (error) {
    console.error('Failed to get cached banlist:', error);
    return null;
  }
}

/**
 * Store banlist in cache
 */
export async function setCachedBanlist(cached: {
  timestamp: number;
  data: Record<string, BanlistItem>;
}): Promise<void> {
  try {
    await chrome.storage.local.set({ [CACHE_KEY]: cached });
  } catch (error) {
    console.error('Failed to cache banlist:', error);
  }
}

/**
 * Check if cache is expired
 */
export function isCacheExpired(cached: CachedBanlist): boolean {
  return Date.now() - cached.timestamp > CACHE_TTL;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
