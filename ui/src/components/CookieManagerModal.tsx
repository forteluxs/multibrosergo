import React, { useState, useEffect, useCallback } from 'react';
import { Profile, CookieItem } from '../types/Profile';
import { ApiService } from '../services/apiService';

interface CookieManagerModalProps {
  profile: Profile;
  onClose: () => void;
}

type ModalTab = 'view' | 'import' | 'export';

export const CookieManagerModal: React.FC<CookieManagerModalProps> = ({ profile, onClose }) => {
  const [tab, setTab] = useState<ModalTab>('view');
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importText, setImportText] = useState('');

  const refreshCookies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getProfileCookies(profile.id);
      setCookies(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cookies');
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    refreshCookies();
  }, [refreshCookies]);

  const handleImport = async () => {
    if (!importText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let parsed: CookieItem[];
      try {
        parsed = JSON.parse(importText.trim());
        if (!Array.isArray(parsed)) {
          throw new Error('Cookies must be a JSON array of cookie objects.');
        }
      } catch (parseErr: unknown) {
        throw new Error(`Invalid JSON format: ${parseErr instanceof Error ? parseErr.message : parseErr}`);
      }
      await ApiService.setProfileCookies(profile.id, parsed);
      setImportText('');
      setTab('view');
      await refreshCookies();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to import cookies');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (cookies.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cookies, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `${profile.name.toLowerCase().replace(/\s+/g, '_')}_cookies.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  const tabStyle = (active: boolean) => ({
    padding: '0.5rem 1rem',
    backgroundColor: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
    color: active ? 'var(--primary-color)' : 'var(--text-secondary)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 500 as const,
    fontSize: '0.85rem',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 id="cookie-modal-title" style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Cookie Manager</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Managing session keys for profile: <strong>{profile.name}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
          <button onClick={() => setTab('view')} style={tabStyle(tab === 'view')}>View Cookies ({cookies.length})</button>
          <button onClick={() => setTab('import')} style={tabStyle(tab === 'import')}>Import Cookies</button>
          <button onClick={() => setTab('export')} style={tabStyle(tab === 'export')}>Export Cookies</button>
        </div>

        {error && (
          <div className="error-alert" style={{ marginBottom: '1rem' }}>
            <span>Error</span>
            <span>{error}</span>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '250px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-secondary)' }}>
              <div className="status-dot online" style={{ width: '12px', height: '12px', marginBottom: '0.5rem' }} />
              <div>Processing cookies... (Puppeteer Headless running)</div>
            </div>
          ) : tab === 'view' ? (
            cookies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                No cookies found in this profile. Cookies are populated automatically when you browse, or you can import them.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.5rem' }}>Domain</th>
                      <th style={{ padding: '0.5rem' }}>Name</th>
                      <th style={{ padding: '0.5rem' }}>Value</th>
                      <th style={{ padding: '0.5rem' }}>Secure</th>
                      <th style={{ padding: '0.5rem' }}>HttpOnly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cookies.map((cookie, idx) => (
                      <tr key={`${cookie.name}-${cookie.domain}-${idx}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.5rem', color: '#a5b4fc', fontWeight: 500 }}>{cookie.domain}</td>
                        <td style={{ padding: '0.5rem', color: '#fff' }}>{cookie.name}</td>
                        <td style={{ padding: '0.5rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                          {(cookie.value || '').length > 25 ? `${cookie.value.substring(0, 25)}...` : cookie.value}
                        </td>
                        <td style={{ padding: '0.5rem' }}>{cookie.secure ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '0.5rem' }}>{cookie.httpOnly ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : tab === 'import' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paste cookie JSON array below:</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[\n  {\n    "name": "session_id",\n    "value": "xyz123...",\n    "domain": ".google.com",\n    "path": "/",\n    "secure": true,\n    "httpOnly": true\n  }\n]'
                style={{
                  width: '100%',
                  height: '180px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleImport} className="btn btn-primary" disabled={!importText.trim() || loading} style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', backgroundColor: 'var(--primary-color)' }}>
                  Import Sesi Cookies
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '1rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
                Export cookies from this profile to a `.json` backup file. You can import this file into any other profile.
              </div>
              <button
                type="button"
                onClick={handleExport}
                className="btn"
                disabled={cookies.length === 0}
                style={{
                  padding: '0.6rem 1.5rem',
                  fontSize: '0.85rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 600,
                }}
              >
                Download JSON Cookies ({cookies.length} items)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
