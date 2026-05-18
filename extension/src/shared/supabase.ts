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

/**
 * Hosted auth page that bridges the Discord OAuth flow with Cloudflare
 * Turnstile. Cloudflare won't let us render a Turnstile widget directly
 * inside a `chrome-extension://...` origin, so this page (served from a
 * real domain we own) does the captcha challenge for us and forwards the
 * token to Supabase, which then handles the Discord round-trip.
 *
 * Lives alongside the landing site at landing/auth/index.html, both
 * deployed together via Cloudflare Pages. See landing/auth/README.md
 * for the Cloudflare / Supabase configuration.
 */
const AUTH_PAGE_URL = 'https://purgeq.wsrv.xyz/auth/';

/**
 * Sign in with Discord via chrome.identity.launchWebAuthFlow.
 *
 * Must be called from the popup (or another UI context with user activation)
 * — chrome.identity is not available in content scripts and won't open an
 * auth popup without a user gesture.
 *
 * The Supabase Auth → URL Configuration → Redirect URLs list must include
 * `https://<extension-id>.chromiumapp.org/*` for the callback to be accepted.
 * Get the redirect URL with chrome.identity.getRedirectURL().
 */
export async function signInWithDiscord(): Promise<void> {
  const redirectTo = chrome.identity.getRedirectURL();
  const authUrl = `${AUTH_PAGE_URL}?redirect_to=${encodeURIComponent(redirectTo)}`;

  const responseUrl = await new Promise<string>((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (result) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          reject(new Error(lastError.message));
          return;
        }
        if (!result) {
          reject(new Error('Auth flow was cancelled'));
          return;
        }
        resolve(result);
      }
    );
  });

  // Supabase returns the tokens in the URL hash (#access_token=...&refresh_token=...).
  const hash = new URL(responseUrl).hash.slice(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    throw new Error('Missing tokens in OAuth redirect URL');
  }

  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (setSessionError) throw setSessionError;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type { Database } from './db.types';
