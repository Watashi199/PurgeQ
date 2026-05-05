/**
 * PurgeQ Popup React Component
 */

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { API_BASE_URL, getBanlist, BanlistItem } from '../shared/utils';

interface BanlistItem {
  id: string;
  faceit_name: string;
  reason: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const PopupApp: React.FC = () => {
  const [banlist, setBanlist] = useState<BanlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newBan, setNewBan] = useState({ faceit_name: '', reason: '', author: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load banlist on mount
  useEffect(() => {
    loadBanlist();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  /**
   * Load banlist from background
   */
  async function loadBanlist() {
    try {
      setLoading(true);
      const banlistMap = await getBanlist();
      const items = Array.from(banlistMap.values());
      setBanlist(items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError(`Failed to load banlist: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Add new ban
   */
  async function handleAddBan(e: React.FormEvent) {
    e.preventDefault();
    if (!newBan.faceit_name || !newBan.reason || !newBan.author) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/v1/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'your-api-key', // Update this to a valid API key
        },
        body: JSON.stringify(newBan),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSuccess('Player added to banlist');
      setNewBan({ faceit_name: '', reason: '', author: '' });
      await loadBanlist();
    } catch (err) {
      setError(`Failed to add ban: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete ban
   */
  async function handleDeleteBan(faceitName: string) {
    if (!window.confirm(`Remove ${faceitName} from banlist?`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ban/${faceitName}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': 'your-api-key',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setSuccess(`${faceitName} removed from banlist`);
      await loadBanlist();
    } catch (err) {
      setError(`Failed to delete ban: ${err}`);
    }
  }

  /**
   * Refresh banlist
   */
  async function handleRefresh() {
    try {
      setLoading(true);
      await loadBanlist();
      setSuccess('Banlist refreshed');
    } catch (err) {
      setError(`Failed to refresh: ${err}`);
    } finally {
      setLoading(false);
    }
  }

  // Filter banlist
  const filteredBanlist = banlist.filter(
    (item) =>
      item.faceit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>🚫 PurgeQ Banlist</h1>
        <div className="stats">
          Banned: <strong>{banlist.length}</strong>
        </div>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

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
            <button onClick={handleRefresh} disabled={loading} className="btn btn-refresh">
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
                    {searchQuery
                      ? 'No results found'
                      : 'No banned players'}
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
                    onChange={(e) => setNewBan({ ...newBan, faceit_name: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Reason"
                    value={newBan.reason}
                    onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={newBan.author}
                    onChange={(e) => setNewBan({ ...newBan, author: e.target.value })}
                    className="input-field"
                  />
                  <button type="submit" disabled={loading} className="btn btn-primary">
                    Add Ban
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Render app
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<PopupApp />);
