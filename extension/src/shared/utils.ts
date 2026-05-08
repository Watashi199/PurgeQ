/**
 * Shared utilities for extension
 */

import { getSettings } from './settings';

const CACHE_KEY = 'purgeq_banlist_cache';
const CACHE_TTL = 3600000; // 1 hour in ms
export const REFRESH_INTERVAL = 60000; // 60 seconds in ms

export interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  created_at: string;
  updated_at: string;
}

interface CachedBanlist {
  timestamp: number;
  data: Map<string, BanlistItem>;
}

export async function getApiBaseUrl(): Promise<string> {
  const { apiUrl } = await getSettings();
  return apiUrl;
}

export async function getApiKey(): Promise<string> {
  const { apiKey } = await getSettings();
  return apiKey;
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
    const apiUrl = await getApiBaseUrl();
    const response = await fetch(`${apiUrl}/api/v1/banlist`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const banlistMap = new Map<string, BanlistItem>();

    data.items.forEach((item: BanlistItem) => {
      banlistMap.set(item.faceit_name.toLowerCase(), item);
    });

    await setCachedBanlist({
      timestamp: Date.now(),
      data: Object.fromEntries(banlistMap),
    });

    return banlistMap;
  } catch (error) {
    console.error('Failed to fetch banlist:', error);
    const fallback = await getCachedBanlist();
    return fallback ? fallback.data : new Map();
  }
}

async function getCachedBanlist(): Promise<CachedBanlist | null> {
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

async function setCachedBanlist(cached: {
  timestamp: number;
  data: Record<string, BanlistItem>;
}): Promise<void> {
  try {
    await chrome.storage.local.set({ [CACHE_KEY]: cached });
  } catch (error) {
    console.error('Failed to cache banlist:', error);
  }
}

export async function clearBanlistCache(): Promise<void> {
  try {
    await chrome.storage.local.remove(CACHE_KEY);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

function isCacheExpired(cached: CachedBanlist): boolean {
  return Date.now() - cached.timestamp > CACHE_TTL;
}
