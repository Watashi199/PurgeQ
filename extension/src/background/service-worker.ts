/**
 * Background service worker for PurgeQ extension
 */

import { getApiBaseUrl, getBanlist, REFRESH_INTERVAL } from '../shared/utils';
import { hasApiHostPermission } from '../shared/settings';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('PurgeQ extension installed');
  // Perform initial banlist fetch
  refreshBanlist();
  // Schedule periodic refresh
  setupRefreshSchedule();
});

/**
 * Setup periodic banlist refresh
 */
function setupRefreshSchedule() {
  // Clear any existing alarms
  chrome.alarms.clear('purgeq_refresh');

  // Create alarm to refresh every minute
  chrome.alarms.create('purgeq_refresh', {
    periodInMinutes: Math.ceil(REFRESH_INTERVAL / 60000),
  });
}

// Listen for alarm signals
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'purgeq_refresh') {
    refreshBanlist();
  }
});

/**
 * Refresh banlist from API
 */
async function refreshBanlist() {
  try {
    const apiUrl = await getApiBaseUrl();
    const allowed = await hasApiHostPermission(apiUrl);
    if (!allowed) {
      console.log(
        `Skipping refresh: no host permission for ${apiUrl}. Open the popup to grant it.`
      );
      return;
    }

    console.log('Refreshing banlist...');
    await getBanlist();
    console.log('Banlist refreshed successfully');

    // Notify all tabs to update UI
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(
            tab.id,
            { type: 'BANLIST_UPDATED' },
            () => {
              // Ignore errors for tabs that don't have content script
              chrome.runtime.lastError; // Consume error
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('Failed to refresh banlist:', error);
  }
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_BANLIST') {
    getBanlist()
      .then((banlist) => {
        sendResponse({
          success: true,
          data: Object.fromEntries(banlist),
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message,
        });
      });
    return true; // Keep channel open for async response
  }

  if (request.type === 'REFRESH_BANLIST') {
    refreshBanlist()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return false;
});

// Setup refresh schedule on service worker startup
setupRefreshSchedule();
