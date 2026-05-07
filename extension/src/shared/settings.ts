/**
 * Extension settings stored in chrome.storage.local
 */

const SETTINGS_KEY = 'purgeq_settings';

export const DEFAULT_API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://192.168.1.47:8000';

export interface Settings {
  apiUrl: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiUrl: DEFAULT_API_URL,
  apiKey: '',
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    const value = stored[SETTINGS_KEY] as Partial<Settings> | undefined;
    return {
      apiUrl: value?.apiUrl?.trim() || DEFAULT_SETTINGS.apiUrl,
      apiKey: value?.apiKey ?? DEFAULT_SETTINGS.apiKey,
    };
  } catch (error) {
    console.error('Failed to read settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const normalized: Settings = {
    apiUrl: normalizeUrl(settings.apiUrl) || DEFAULT_SETTINGS.apiUrl,
    apiKey: settings.apiKey.trim(),
  };
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  return trimmed;
}

function urlToOriginPattern(url: string): string | null {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  try {
    return `${new URL(normalized).origin}/*`;
  } catch {
    return null;
  }
}

export async function hasApiHostPermission(url: string): Promise<boolean> {
  const origin = urlToOriginPattern(url);
  if (!origin) return false;
  try {
    return await chrome.permissions.contains({ origins: [origin] });
  } catch {
    return false;
  }
}

/**
 * Request host permission for the given API URL.
 * Returns true if already granted or successfully granted, false otherwise.
 * Must be called from a user gesture context.
 */
export async function requestApiHostPermission(url: string): Promise<boolean> {
  const origin = urlToOriginPattern(url);
  if (!origin) return false;

  try {
    const already = await chrome.permissions.contains({ origins: [origin] });
    if (already) return true;
    return await chrome.permissions.request({ origins: [origin] });
  } catch (error) {
    console.error('Permission request failed:', error);
    return false;
  }
}
