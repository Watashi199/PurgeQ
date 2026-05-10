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

type Tab = 'banlist' | 'import' | 'export' | 'settings';

interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel?: string;
  resolve: (ok: boolean) => void;
}

const Icon = {
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  List: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  GitHub: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.55v-1.92c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.35.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.17a10.9 10.9 0 0 1 5.75 0c2.2-1.48 3.16-1.17 3.16-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
      <path d="m12 2.5 3.09 6.26 6.91 1-5 4.87 1.18 6.87L12 18.27l-6.18 3.23L7 14.63l-5-4.87 6.91-1L12 2.5Z"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M18.244 2H21l-6.522 7.452L22 22h-6.828l-4.77-6.234L4.8 22H2l7.07-8.078L2 2h6.914l4.302 5.69L18.244 2Zm-1.197 18h1.62L7.04 3.93H5.3l11.747 16.07Z"/>
    </svg>
  ),
};

function avatarColor(name: string): string {
  // Deterministic hue from the nickname so each avatar has a stable color.
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

const PopupApp: React.FC = () => {
  const [tab, setTab] = useState<Tab>('banlist');
  const [banlist, setBanlist] = useState<BanlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newBan, setNewBan] = useState({ faceit_name: '', reason: '', author: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  function askConfirm(
    title: string,
    message: string,
    confirmLabel = 'Confirm'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      setConfirmRequest({ title, message, confirmLabel, resolve });
    });
  }

  function settleConfirm(value: boolean) {
    if (!confirmRequest) return;
    confirmRequest.resolve(value);
    setConfirmRequest(null);
  }

  useEffect(() => {
    (async () => {
      const stored = await getSettings();
      setSettings(stored);
      setDraftSettings(stored);
      await loadBanlist();
    })();
  }, []);

  useEffect(() => {
    if (!error && !success) return;
    const timer = setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
    return () => clearTimeout(timer);
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
            setTab('settings');
          } else {
            setError(
              `Could not reach the API at ${apiUrl}. Check that the server is running.`
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
      setError('API key is not set. Open Settings to configure it.');
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
    const ok = await askConfirm(
      `Unban ${faceitName}`,
      'This player will no longer be highlighted on FACEIT pages.'
    );
    if (!ok) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
      setError('API key is not set. Open Settings to configure it.');
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

  async function handleImportFile(file: File) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      setError('API key is not set. Open Settings to configure it.');
      return;
    }

    const apiUrl = await getApiBaseUrl();
    const author = settings.defaultAuthor.trim();
    if (!author) {
      setError('Set a Default author in Settings before importing.');
      return;
    }

    let body: string;
    let contentType: string;
    const lower = file.name.toLowerCase();
    const text = await file.text();

    if (lower.endsWith('.csv')) {
      body = text;
      contentType = 'text/csv';
    } else {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setError('Could not parse the JSON file');
        return;
      }
      const items = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { items?: unknown }).items)
          ? (parsed as { items: unknown[] }).items
          : null;
      if (!items) {
        setError('JSON must be an array of names/objects, or {items: [...]}');
        return;
      }
      body = JSON.stringify({
        items,
        default_author: author,
        default_reason: 'Imported',
      });
      contentType = 'application/json';
    }

    try {
      setLoading(true);
      const url = new URL(`${apiUrl}/api/v1/banlist/import`);
      if (contentType === 'text/csv') {
        url.searchParams.set('author', author);
      }
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': contentType, 'X-API-Key': apiKey },
        body,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const summary = (await response.json()) as {
        imported: number;
        skipped: string[];
        failed: { input: string; reason: string }[];
      };
      const parts = [`${summary.imported} imported`];
      if (summary.skipped.length) parts.push(`${summary.skipped.length} skipped`);
      if (summary.failed.length) parts.push(`${summary.failed.length} failed`);
      setSuccess(parts.join(', '));
      if (summary.failed.length) {
        console.warn('[PurgeQ] Import failures:', summary.failed);
      }
      await clearBanlistCache();
      await loadBanlist();
      setTab('banlist');
    } catch (err) {
      setError(`Import failed: ${err}`);
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
      setTab('banlist');
    } catch (err) {
      setError(`Failed to save settings: ${err}`);
    }
  }

  function handleResetSettings() {
    setDraftSettings({ apiUrl: DEFAULT_API_URL, apiKey: '', defaultAuthor: '' });
  }

  function handleExport(format: 'json' | 'csv') {
    if (banlist.length === 0) {
      setError('Banlist is empty, nothing to export.');
      return;
    }

    const stamp = new Date().toISOString().slice(0, 10);
    let content: string;
    let mime: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          items: banlist.map((b) => ({
            faceit_name: b.faceit_name,
            reason: b.reason,
            author: b.author,
            created_at: b.created_at,
          })),
        },
        null,
        2
      );
      mime = 'application/json';
      filename = `purgeq-banlist-${stamp}.json`;
    } else {
      const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const rows = ['faceit_name,reason,author,created_at'];
      for (const b of banlist) {
        rows.push(
          [b.faceit_name, b.reason, b.author, b.created_at].map(escape).join(',')
        );
      }
      content = rows.join('\n');
      mime = 'text/csv;charset=utf-8';
      filename = `purgeq-banlist-${stamp}.csv`;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setSuccess(`Exported ${banlist.length} entries as ${format.toUpperCase()}`);
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
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon"><Icon.Shield /></span>
          <span className="brand-name">PurgeQ</span>
        </div>
        <nav className="nav">
          <button
            className={`nav-item ${tab === 'banlist' ? 'is-active' : ''}`}
            onClick={() => setTab('banlist')}
          >
            <Icon.List /> <span>Banlist</span>
          </button>
          <button
            className={`nav-item ${tab === 'import' ? 'is-active' : ''}`}
            onClick={() => setTab('import')}
          >
            <Icon.Upload /> <span>Import</span>
          </button>
          <button
            className={`nav-item ${tab === 'export' ? 'is-active' : ''}`}
            onClick={() => setTab('export')}
          >
            <Icon.Download /> <span>Export</span>
          </button>
          <button
            className={`nav-item ${tab === 'settings' ? 'is-active' : ''}`}
            onClick={() => {
              setDraftSettings(settings);
              setTab('settings');
            }}
          >
            <Icon.Settings /> <span>Settings</span>
          </button>
        </nav>
        <div className="sidebar-links">
          <a
            href="https://github.com/Watashi199/PurgeQ"
            target="_blank"
            rel="noreferrer"
            title="GitHub repository"
            className="sidebar-link"
          >
            <Icon.GitHub />
          </a>
          <a
            href="https://github.com/Watashi199/PurgeQ/stargazers"
            target="_blank"
            rel="noreferrer"
            title="Star the repo"
            className="sidebar-link sidebar-link-star"
          >
            <Icon.Star />
          </a>
          <a
            href="https://x.com/Watashi_R6S"
            target="_blank"
            rel="noreferrer"
            title="@Watashi_R6S on X"
            className="sidebar-link"
          >
            <Icon.X />
          </a>
        </div>

        <div className="sidebar-footer">
          <div className="footer-label">Server</div>
          <div className="footer-value" title={settings.apiUrl}>{settings.apiUrl}</div>
          <div className="footer-value">Banned: {banlist.length}</div>
        </div>
      </aside>

      <main className="main">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {tab === 'banlist' && (
          <section className="page">
            <h2 className="page-title">Banlist</h2>

            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon"><Icon.Search /></span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Refresh"
                onClick={handleRefresh}
                disabled={loading}
              >
                <Icon.Refresh />
              </button>
              <button
                type="button"
                className="icon-btn"
                title="Import a banlist"
                onClick={() => setTab('import')}
              >
                <Icon.Upload />
              </button>
            </div>

            <div className="banlist">
              {loading ? (
                <div className="empty">Loading...</div>
              ) : filteredBanlist.length === 0 ? (
                <div className="empty">
                  {searchQuery ? 'No results found' : 'No banned players yet'}
                </div>
              ) : (
                filteredBanlist.map((item) => (
                  <div key={item.id} className="ban-card">
                    <div
                      className="avatar"
                      style={{ background: avatarColor(item.faceit_name) }}
                    >
                      {item.faceit_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ban-meta">
                      <div className="ban-name">{item.faceit_name}</div>
                      <div className="ban-line">
                        <span className="muted">Reason:</span> {item.reason}
                      </div>
                      <div className="ban-line muted">
                        By: {item.author} · {formatDate(item.created_at)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="delete-btn"
                      title="Remove from banlist"
                      onClick={() => handleDeleteBan(item.faceit_name)}
                    >
                      <Icon.Trash />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="add-ban">
              <h3 className="section-title">Add to banlist</h3>
              <form onSubmit={handleAddBan} className="form">
                <input
                  type="text"
                  className="input"
                  placeholder="FACEIT username"
                  value={newBan.faceit_name}
                  onChange={(e) =>
                    setNewBan({ ...newBan, faceit_name: e.target.value })
                  }
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Reason"
                  value={newBan.reason}
                  onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={newBan.author}
                  onChange={(e) => setNewBan({ ...newBan, author: e.target.value })}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  Add Ban
                </button>
              </form>
            </div>
          </section>
        )}

        {tab === 'import' && (
          <section className="page">
            <h2 className="page-title">Import</h2>
            <p className="page-hint">
              Bulk-import a list of FACEIT names from a JSON or CSV file. Existing
              entries are skipped automatically.
            </p>

            <label className="dropzone">
              <Icon.Upload />
              <div className="dropzone-title">Choose a file</div>
              <div className="dropzone-hint">.json or .csv (max 1000 names)</div>
              <input
                type="file"
                accept=".json,.csv,.txt"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) handleImportFile(file);
                }}
              />
            </label>

            <div className="hint-block">
              <strong>JSON</strong> — an array of names <code>["Watashi-", "Foo"]</code>,
              an array of objects <code>{'[{"faceit_name": "Watashi-", "reason": "..."}]'}</code>,
              or <code>{'{"items": [...]}'}</code>.
              <br />
              <strong>CSV</strong> — first row must be a header containing
              <code>faceit_name</code> (or <code>name</code>); optional
              <code>reason</code> and <code>author</code> columns are picked up too.
              <br />
              <strong>Author</strong> defaults to the value set in Settings, used
              for any rows that don't carry their own.
            </div>
          </section>
        )}

        {tab === 'export' && (
          <section className="page">
            <h2 className="page-title">Export</h2>
            <p className="page-hint">
              Download the current banlist as a JSON or CSV file. The JSON
              format round-trips through Import; the CSV is convenient for
              spreadsheets.
            </p>

            <div className="export-grid">
              <button
                type="button"
                className="export-card"
                onClick={() => handleExport('json')}
                disabled={banlist.length === 0}
              >
                <span className="export-icon"><Icon.Download /></span>
                <span className="export-title">JSON</span>
                <span className="export-sub">{banlist.length} entries</span>
              </button>
              <button
                type="button"
                className="export-card"
                onClick={() => handleExport('csv')}
                disabled={banlist.length === 0}
              >
                <span className="export-icon"><Icon.Download /></span>
                <span className="export-title">CSV</span>
                <span className="export-sub">{banlist.length} entries</span>
              </button>
            </div>

            <div className="hint-block">
              The file lands in your usual download folder. Re-importing it
              later restores the same names — duplicates will be skipped.
            </div>
          </section>
        )}

        {tab === 'settings' && (
          <section className="page">
            <h2 className="page-title">Settings</h2>
            <form onSubmit={handleSaveSettings} className="settings-form">
              <label className="field">
                <span className="field-label">API server URL</span>
                <input
                  type="text"
                  className="input"
                  placeholder="http://localhost:8000"
                  value={draftSettings.apiUrl}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, apiUrl: e.target.value })
                  }
                />
                <span className="field-hint">
                  Examples: http://localhost:8000, http://192.168.1.10:8000,
                  https://api.example.com
                </span>
              </label>

              <label className="field">
                <span className="field-label">API key</span>
                <input
                  type="password"
                  className="input"
                  placeholder="X-API-Key value"
                  value={draftSettings.apiKey}
                  onChange={(e) =>
                    setDraftSettings({ ...draftSettings, apiKey: e.target.value })
                  }
                  autoComplete="off"
                />
                <span className="field-hint">
                  Required to add or remove bans. Stored locally. On a public
                  PurgeQ server, click the button below to receive one.
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-self-start"
                  onClick={handleGetKey}
                >
                  Get a key with Discord
                </button>
              </label>

              <label className="field">
                <span className="field-label">Default author</span>
                <input
                  type="text"
                  className="input"
                  placeholder="Your name (used when banning from FACEIT)"
                  maxLength={32}
                  value={draftSettings.defaultAuthor}
                  onChange={(e) =>
                    setDraftSettings({
                      ...draftSettings,
                      defaultAuthor: e.target.value,
                    })
                  }
                />
                <span className="field-hint">
                  Used as the "author" when you click the inline ban button on a
                  player card.
                </span>
              </label>

              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleResetSettings}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleTestConnection}
                >
                  Test connection
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setDraftSettings(settings);
                    setTab('banlist');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-inline">
                  Save
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {confirmRequest && (
        <div className="modal-backdrop" onClick={() => settleConfirm(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <span className="modal-icon"><Icon.Shield /></span>
              <span className="modal-title">{confirmRequest.title}</span>
            </div>
            <div className="modal-message">{confirmRequest.message}</div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost btn-inline"
                onClick={() => settleConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-inline"
                onClick={() => settleConfirm(true)}
                autoFocus
              >
                {confirmRequest.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<PopupApp />);
