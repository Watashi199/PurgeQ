/**
 * Extension settings stored in chrome.storage.local
 */

import { DEFAULT_LANGUAGE, Language, detectLanguage } from './i18n';

const SETTINGS_KEY = 'purgeq_settings';

export const DEFAULT_API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface Settings {
  apiUrl: string;
  apiKey: string;
  defaultAuthor: string;
  language: Language;
}

export const DEFAULT_SETTINGS: Settings = {
  apiUrl: DEFAULT_API_URL,
  apiKey: '',
  defaultAuthor: '',
  language: DEFAULT_LANGUAGE,
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    const value = stored[SETTINGS_KEY] as Partial<Settings> | undefined;
    return {
      apiUrl: value?.apiUrl?.trim() || DEFAULT_SETTINGS.apiUrl,
      apiKey: value?.apiKey ?? DEFAULT_SETTINGS.apiKey,
      defaultAuthor: value?.defaultAuthor ?? DEFAULT_SETTINGS.defaultAuthor,
      language: (value?.language as Language) || detectLanguage(),
    };
  } catch (error) {
    console.error('Failed to read settings:', error);
    return { ...DEFAULT_SETTINGS, language: detectLanguage() };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  const normalized: Settings = {
    apiUrl: normalizeUrl(settings.apiUrl) || DEFAULT_SETTINGS.apiUrl,
    apiKey: settings.apiKey.trim(),
    defaultAuthor: settings.defaultAuthor.trim(),
    language: settings.language || DEFAULT_LANGUAGE,
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

export function hasApiHostPermission(url: string): Promise<boolean> {
  const origin = urlToOriginPattern(url);
  if (!origin) return Promise.resolve(false);
  return containsCallback(origin);
}

function hasUserActivation(): boolean {
  return (navigator as Navigator & { userActivation?: { isActive: boolean } })
    .userActivation?.isActive ?? true;
}

function containsCallback(origin: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      chrome.permissions.contains({ origins: [origin] }, (granted) => {
        void chrome.runtime.lastError;
        resolve(!!granted);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Request host permission for the given API URL.
 *
 * Uses the callback variant of `chrome.permissions.request` so any failure
 * surfaces silently through `chrome.runtime.lastError` instead of producing
 * a Promise rejection that Chrome logs to the console as
 * "Permission request failed: ...".
 *
 * If we don't have a transient user activation, we skip the request entirely
 * and just report whether the permission is already granted.
 */
export function requestApiHostPermission(url: string): Promise<boolean> {
  const origin = urlToOriginPattern(url);
  if (!origin) return Promise.resolve(false);

  if (!hasUserActivation()) {
    return containsCallback(origin);
  }

  return new Promise((resolve) => {
    try {
      chrome.permissions.request({ origins: [origin] }, (granted) => {
        if (chrome.runtime.lastError) {
          containsCallback(origin).then(resolve);
          return;
        }
        resolve(!!granted);
      });
    } catch {
      containsCallback(origin).then(resolve);
    }
  });
}
