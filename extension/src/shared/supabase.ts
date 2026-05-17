/**
 * Shared Supabase client for the SaaS backend.
 *
 * Used by all three MV3 contexts (popup, background service worker,
 * content script). Auth session is persisted in chrome.storage.local so it
 * survives across reloads and is reachable from the service worker, where
 * window.localStorage doesn't exist.
 *
 * RLS enforces per-tenant isolation server-side; the publishable key below
 * has no admin rights and is safe to ship in the extension bundle.
 */
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import type { Database } from './db.types';

const SUPABASE_URL = 'https://ehszjqppifszlgfanmbp.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vmsaF39NN_E9Kwf0UAlqgA_t-uFczVK';

// chrome.storage.local-backed adapter implementing the SupportedStorage
// interface Supabase's auth module expects.
const chromeStorageAdapter: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    return (result[key] as string | undefined) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: chromeStorageAdapter,
    persistSession: true,
    autoRefreshToken: true,
    // Disable URL detection — MV3 doesn't have a "current URL" in the
    // service worker, and the popup uses chrome.identity.launchWebAuthFlow
    // to handle the OAuth redirect rather than a window URL hash.
    detectSessionInUrl: false,
  },
});

export type { Database } from './db.types';
