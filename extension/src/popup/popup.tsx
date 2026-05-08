/**
 * PurgeQ Popup React Component
 */

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BanlistItem,
  clearBanlistCache,
  getApiBaseUrl,
  getApiKey,
  getBanlist,
} from '../shared/utils';
import {
  DEFAULT_API_URL,
  Settings,
  getSettings,
  hasApiHostPermission,
  requestApiHostPermission,
  saveSettings,
} from '../shared/settings';

const PopupApp: React.FC = () => {
  const [banlist, setBanlist] = useState<BanlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newBan, setNewBan] = useState({ faceit_name: '', reason: '', author: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    apiUrl: DEFAULT_API_URL,
    apiKey: '',
    defaultAuthor: '',
  });
  const [draftSettings, setDraftSettings] = useState<Settings>({
    apiUrl: DEFAULT_API_URL,
    apiKey: '',
    defaultAuthor: '',
  });

  useEffect(() => {
    (async () => {
      const stored = await getSettings();
      setSettings(stored);
      setDraftSettings(stored);
      await loadBanlist();
    })();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  async function loadBanlist() {
    try {
      setLoading(true);
      const apiUrl = await getApiBaseUrl();
      const banlistMap = await getBanlist();
      const items = Array.from(banlistMap.values());
      setBanlist(
        items.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );

      if (items.length === 0) {
        const probe = await fetch(`${apiUrl}/`).catch(() => null);
        if (!probe || !probe.ok) {
          const allowed = await hasApiHostPermission(apiUrl);
          if (!allowed) {
            setError(
              `Could not reach ${apiUrl}. Open Settings and click Save to grant access.`
            );
            setShowSettings(true);
          } else {
            setError(
              `Could not reach the API at ${apiUrl}. Check that the server is running and the URL is correct.`
            );
          }
        }
      }
    } catch (err) {
      setError(`Failed to load banlist: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestConnection() {
    const url = (draftSettings.apiUrl.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
    setError('');
    setSuccess('');
    try {
      const granted = await requestApiHostPermission(url);
      if (!granted) {
        setError('Permission denied for this URL.');
        return;
      }
      const response = await fetch(`${url}/`);
      if (response.ok) {
        const data = await response.json().catch(() => null);
        const version = data?.version ? ` (v${data.version})` : '';
        setSuccess(`Connected to ${url}${version}`);
      } else {
        setError(`Server returned HTTP ${response.status} from ${url}`);
      }
    } catch (err) {
      setError(`Could not reach ${url}: ${err}`);
    }
  }

  async function handleAddBan(e: React.FormEvent) {
    e.preventDefault();
    if (!newBan.faceit_name || !newBan.reason || !newBan.author) {
      setError('All fields are required');
      return;
    }

    const apiKey = await getApiKey();
    if (!apiKey) {
      setError('API key is not set. Open settings to configure it.');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = await getApiBaseUrl();
      const response = await fetch(`${apiUrl}/api/v1/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(newBan),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSuccess('Player added to banlist');
      setNewBan({ faceit_name: '', reason: '', author: '' });
      await clearBanlistCache();
      await loadBanlist();
    } catch (err) {
      setError(`Failed to add ban: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBan(faceitName: string) {
    if (!window.confirm(`Remove ${faceitName} from banlist?`)) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
      setError('API key is not set. Open settings to configure it.');
      return;
    }

    try {
      const apiUrl = await getApiBaseUrl();
      const response = await fetch(
        `${apiUrl}/api/v1/ban/${encodeURIComponent(faceitName)}`,
        {
          method: 'DELETE',
          headers: { 'X-API-Key': apiKey },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSuccess(`${faceitName} removed from banlist`);
      await clearBanlistCache();
      await loadBanlist();
    } catch (err) {
      setError(`Failed to delete ban: ${err}`);
    }
  }

  async function handleRefresh() {
    try {
      setLoading(true);
      await clearBanlistCache();
      await loadBanlist();
      setSuccess('Banlist refreshed');
    } catch (err) {
      setError(`Failed to refresh: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      const granted = await requestApiHostPermission(draftSettings.apiUrl);
      if (!granted) {
        setError(
          'Host permission denied. The extension needs access to the API URL to fetch data.'
        );
        return;
      }
      await saveSettings(draftSettings);
      const refreshed = await getSettings();
      setSettings(refreshed);
      setDraftSettings(refreshed);
      await clearBanlistCache();
      await loadBanlist();
      setSuccess('Settings saved');
      setShowSettings(false);
    } catch (err) {
      setError(`Failed to save settings: ${err}`);
    }
  }

  function handleResetSettings() {
    setDraftSettings({ apiUrl: DEFAULT_API_URL, apiKey: '', defaultAuthor: '' });
  }

  function handleGetKey() {
    const url = (draftSettings.apiUrl.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
    chrome.tabs.create({ url: `${url}/signup` });
  }

  const filteredBanlist = banlist.filter(
    (item) =>
      item.faceit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="popup-header-row">
          <h1>🚫 PurgeQ Banlist</h1>
          <button
            type="button"
            className="btn-icon"
            onClick={() => {
              setDraftSettings(settings);
              setShowSettings((v) => !v);
            }}
            title="Settings"
          >
            ⚙️
          </button>
        </div>
        <div className="stats">
          Server: <strong>{settings.apiUrl}</strong> · Banned:{' '}
          <strong>{banlist.length}</strong>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showSettings ? (
        <form className="settings-panel" onSubmit={handleSaveSettings}>
          <h3>Settings</h3>
          <label className="settings-label">
            API server URL
            <input
              type="text"
              className="input-field"
              placeholder="http://192.168.1.47:8000"
              value={draftSettings.apiUrl}
              onChange={(e) =>
                setDraftSettings({ ...draftSettings, apiUrl: e.target.value })
              }
            />
            <span className="settings-hint">
              Examples: http://localhost:8000, http://192.168.1.47:8000,
              https://api.example.com
            </span>
          </label>
          <label className="settings-label">
            API key
            <input
              type="password"
              className="input-field"
              placeholder="X-API-Key value"
              value={draftSettings.apiKey}
              onChange={(e) =>
                setDraftSettings({ ...draftSettings, apiKey: e.target.value })
              }
              autoComplete="off"
            />
            <span className="settings-hint">
              Required to add or remove bans. Stored locally in chrome.storage.
              On a public PurgeQ server, click <em>Get a key with Discord</em>{' '}
              below to receive one.
            </span>
            <button
              type="button"
              className="btn btn-refresh"
              onClick={handleGetKey}
              style={{ alignSelf: 'flex-start' }}
            >
              Get a key with Discord
            </button>
          </label>
          <label className="settings-label">
            Default author
            <input
              type="text"
              className="input-field"
              placeholder="Your name (used when banning from FACEIT)"
              maxLength={32}
              value={draftSettings.defaultAuthor}
              onChange={(e) =>
                setDraftSettings({ ...draftSettings, defaultAuthor: e.target.value })
              }
            />
            <span className="settings-hint">
              Used as the "author" when you click the inline ban button on a player card.
            </span>
          </label>
          <div className="settings-actions">
            <button type="button" className="btn btn-refresh" onClick={handleResetSettings}>
              Reset to default
            </button>
            <button type="button" className="btn btn-refresh" onClick={handleTestConnection}>
              Test connection
            </button>
            <button
              type="button"
              className="btn btn-refresh"
              onClick={() => {
                setDraftSettings(settings);
                setShowSettings(false);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="popup-tabs">
          <div className="tab-content">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="btn btn-refresh"
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <>
                <div className="banlist-items">
                  {filteredBanlist.length > 0 ? (
                    filteredBanlist.map((item) => (
                      <div key={item.id} className="ban-item">
                        <div className="ban-item-header">
                          <span className="player-name">{item.faceit_name}</span>
                          <button
                            onClick={() => handleDeleteBan(item.faceit_name)}
                            className="btn btn-small btn-delete"
                            title="Remove from banlist"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="ban-item-body">
                          <div className="ban-info">
                            <strong>Reason:</strong> {item.reason}
                          </div>
                          <div className="ban-info">
                            <strong>By:</strong> {item.author}
                          </div>
                          <div className="ban-date">
                            {new Date(item.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      {searchQuery ? 'No results found' : 'No banned players'}
                    </div>
                  )}
                </div>

                <div className="add-ban-section">
                  <h3>Add to Banlist</h3>
                  <form onSubmit={handleAddBan} className="add-ban-form">
                    <input
                      type="text"
                      placeholder="FACEIT username"
                      value={newBan.faceit_name}
                      onChange={(e) =>
                        setNewBan({ ...newBan, faceit_name: e.target.value })
                      }
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Reason"
                      value={newBan.reason}
                      onChange={(e) =>
                        setNewBan({ ...newBan, reason: e.target.value })
                      }
                      className="input-field"
                    />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={newBan.author}
                      onChange={(e) =>
                        setNewBan({ ...newBan, author: e.target.value })
                      }
                      className="input-field"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      Add Ban
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<PopupApp />);
