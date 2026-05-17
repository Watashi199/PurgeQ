/**
 * Extension user settings stored in chrome.storage.local.
 *
 * Auth credentials are managed by supabase-js (via its chrome.storage
 * adapter, see ./supabase.ts), not here. This file only holds the
 * preferences a user can tweak from the popup Settings panel.
 */

import { DEFAULT_LANGUAGE, Language, detectLanguage } from './i18n';

const SETTINGS_KEY = 'purgeq_settings';

export interface Settings {
  defaultAuthor: string;
  language: Language;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultAuthor: '',
  language: DEFAULT_LANGUAGE,
};

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get(SETTINGS_KEY);
    const value = stored[SETTINGS_KEY] as Partial<Settings> | undefined;
    return {
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
    defaultAuthor: settings.defaultAuthor.trim(),
    language: settings.language || DEFAULT_LANGUAGE,
  };
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
}
