/**
 * Background service worker for PurgeQ extension
 */

import {
  clearBanlistCache,
  getApiBaseUrl,
  getApiKey,
  getBanlist,
  REFRESH_INTERVAL,
} from '../shared/utils';
import { getSettings, hasApiHostPermission } from '../shared/settings';

const ALARM_NAME = 'purgeq_refresh';

chrome.runtime.onInstalled.addListener(() => {
  console.log('PurgeQ extension installed');
  refreshBanlist();
  setupRefreshSchedule();
});

function setupRefreshSchedule() {
  chrome.alarms.clear(ALARM_NAME);
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: Math.max(1, Math.ceil(REFRESH_INTERVAL / 60000)),
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    refreshBanlist();
  }
});

async function refreshBanlist() {
  try {
    const apiUrl = await getApiBaseUrl();
    if (!(await hasApiHostPermission(apiUrl))) {
      console.log(
        `Skipping refresh: no host permission for ${apiUrl}. Open the popup to grant it.`
      );
      return;
    }

    await clearBanlistCache();
    await getBanlist();
    notifyTabs({ type: 'BANLIST_UPDATED' });
  } catch (error) {
    console.error('Failed to refresh banlist:', error);
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

interface BanPayload {
  faceit_name: string;
  reason: string;
  author: string;
}

async function addBan(payload: BanPayload) {
  const apiUrl = await getApiBaseUrl();
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key is not set. Open the popup settings.');

  if (!(await hasApiHostPermission(apiUrl))) {
    throw new Error(`No permission to reach ${apiUrl}. Open the popup to grant it.`);
  }

  const response = await fetch(`${apiUrl}/api/v1/ban`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  await refreshBanlist();
}

async function removeBan(faceitName: string) {
  const apiUrl = await getApiBaseUrl();
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key is not set. Open the popup settings.');

  if (!(await hasApiHostPermission(apiUrl))) {
    throw new Error(`No permission to reach ${apiUrl}. Open the popup to grant it.`);
  }

  const response = await fetch(
    `${apiUrl}/api/v1/ban/${encodeURIComponent(faceitName)}`,
    {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey },
    }
  );

  if (!response.ok && response.status !== 204) {
    const detail = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
  }

  await refreshBanlist();
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.type === 'GET_BANLIST') {
    getBanlist()
      .then((banlist) => {
        sendResponse({ success: true, data: Object.fromEntries(banlist) });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request?.type === 'REFRESH_BANLIST') {
    refreshBanlist()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request?.type === 'ADD_BAN') {
    (async () => {
      try {
        const settings = await getSettings();
        const payload: BanPayload = {
          faceit_name: String(request.payload?.faceit_name || '').trim(),
          reason: String(request.payload?.reason || '').trim(),
          author:
            String(request.payload?.author || '').trim() ||
            settings.defaultAuthor.trim(),
        };
        if (!payload.faceit_name || !payload.reason || !payload.author) {
          throw new Error(
            'faceit_name, reason and author are required (set a default author in popup settings).'
          );
        }
        await addBan(payload);
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

  if (request?.type === 'REMOVE_BAN') {
    (async () => {
      try {
        const name = String(request.payload?.faceit_name || '').trim();
        if (!name) throw new Error('faceit_name is required');
        await removeBan(name);
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

setupRefreshSchedule();
