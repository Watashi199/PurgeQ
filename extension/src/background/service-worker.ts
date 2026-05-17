/**
 * Background service worker — Supabase backend.
 *
 * Talks to Supabase on behalf of the popup and content scripts so the
 * session token never leaks into FACEIT pages. Maintains a 60s-refresh
 * Map<faceit_name, BanInfo> in chrome.storage.local that the content
 * script reads via the GET_BANLIST message.
 */

import {
  addBan,
  clearBanlistCache,
  getCachedBanlist,
  refreshBanlistFromSupabase,
  removeBanById,
  resetPersonalBanlistCache,
  type AddBanInput,
} from '../shared/banlist-store';
import { getSettings } from '../shared/settings';
import { supabase } from '../shared/supabase';

const ALARM_NAME = 'purgeq_refresh';
const REFRESH_INTERVAL_MIN = 1;

// ─────────────── Lifecycle ───────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[PurgeQ] Extension installed');
  setupRefreshSchedule();
  refreshIfSignedIn();
});

function setupRefreshSchedule() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: REFRESH_INTERVAL_MIN });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    refreshIfSignedIn();
  }
});

// Make sure the alarm exists even after a service-worker restart.
setupRefreshSchedule();

// ─────────────── Auth state ───────────────

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    refreshBanlist().catch((err) =>
      console.error('[PurgeQ] Auth-triggered refresh failed:', err)
    );
  } else if (event === 'SIGNED_OUT') {
    resetPersonalBanlistCache();
    clearBanlistCache()
      .then(() => notifyTabs({ type: 'BANLIST_UPDATED' }))
      .catch((err) => console.error('[PurgeQ] Sign-out clear failed:', err));
  }
});

// ─────────────── Refresh ───────────────

async function refreshIfSignedIn() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return; // Anonymous — nothing to fetch.
  await refreshBanlist();
}

async function refreshBanlist() {
  try {
    await refreshBanlistFromSupabase();
    notifyTabs({ type: 'BANLIST_UPDATED' });
  } catch (error) {
    console.error('[PurgeQ] Failed to refresh banlist:', error);
  }
}

function notifyTabs(message: unknown) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message, () => {
          void chrome.runtime.lastError;
        });
      }
    });
  });
}

// ─────────────── Message router ───────────────

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type === 'GET_BANLIST') {
    getCachedBanlist()
      .then((banlist) => {
        sendResponse({ success: true, data: Object.fromEntries(banlist) });
      })
      .catch((error) => {
        sendResponse({ success: false, error: String(error?.message ?? error) });
      });
    return true;
  }

  if (request?.type === 'REFRESH_BANLIST') {
    refreshIfSignedIn()
      .then(() => sendResponse({ success: true }))
      .catch((error) =>
        sendResponse({ success: false, error: String(error?.message ?? error) })
      );
    return true;
  }

  if (request?.type === 'ADD_BAN') {
    (async () => {
      try {
        const settings = await getSettings();
        // author_name precedence: explicit payload > Settings default > the
        // Discord display_name (filled in by addBan() itself when this is blank).
        const payload: AddBanInput = {
          faceit_name: String(request.payload?.faceit_name || '').trim(),
          reason: String(request.payload?.reason || '').trim(),
          author_name:
            String(request.payload?.author || '').trim() ||
            settings.defaultAuthor.trim() ||
            undefined,
        };
        if (!payload.faceit_name || !payload.reason) {
          throw new Error('faceit_name and reason are required');
        }
        await addBan(payload);
        await refreshBanlist();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
    return true;
  }

  if (request?.type === 'AUTH_CHANGED') {
    // Popup just signed in or out — pull a fresh session and refresh.
    refreshIfSignedIn()
      .then(() => sendResponse({ success: true }))
      .catch((error) =>
        sendResponse({ success: false, error: String(error?.message ?? error) })
      );
    return true;
  }

  if (request?.type === 'REMOVE_BAN') {
    (async () => {
      try {
        const name = String(request.payload?.faceit_name || '').trim().toLowerCase();
        if (!name) throw new Error('faceit_name is required');
        const cache = await getCachedBanlist();
        const ban = cache.get(name);
        if (!ban) throw new Error('Ban not found in local cache');
        await removeBanById(ban.id);
        await refreshBanlist();
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })();
    return true;
  }

  return false;
});
