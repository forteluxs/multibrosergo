import React, { useState, useEffect } from 'react';
import { useProfiles } from './hooks/useProfiles';
import { ApiService } from './services/apiService';
import { Profile } from './types/Profile';
import './App.css';

// User Agent Presets
const UA_PRESETS = [
  {
    label: 'Windows Chrome (Recommended)',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    label: 'Windows Edge',
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  },
  {
    label: 'macOS Safari',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  },
  {
    label: 'macOS Chrome',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    label: 'Linux Firefox',
    value: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  },
  {
    label: 'Custom User Agent...',
    value: 'custom',
  }
];

function App() {
  const { profiles, loading, error, createProfile, launchProfile, deleteProfile, updateProfileNotes } = useProfiles();
  
  // Basic states
  const [profileName, setProfileName] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  
  // Inline editing notes states
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotesValue, setTempNotesValue] = useState('');
  
  // Cookie manager states
  const [isCookiesModalOpen, setIsCookiesModalOpen] = useState(false);
  const [activeCookiesProfile, setActiveCookiesProfile] = useState<Profile | null>(null);
  const [cookiesList, setCookiesList] = useState<any[]>([]);
  const [cookiesModalTab, setCookiesModalTab] = useState<'view' | 'import' | 'export'>('view');
  const [cookieImportText, setCookieImportText] = useState('');
  const [cookiesLoading, setCookiesLoading] = useState(false);
  const [cookiesError, setCookiesError] = useState<string | null>(null);

  // Proxy states
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  
  // Fingerprint states
  const [selectedUa, setSelectedUa] = useState(UA_PRESETS[0].value);
  const [customUa, setCustomUa] = useState('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  const [screenResolution, setScreenResolution] = useState('1920x1080');
  const [webglVendor, setWebGLVendor] = useState('Google Inc. (NVIDIA)');
  const [timezone, setTimezone] = useState('auto');
  const [webrtcMode, setWebrtcMode] = useState('altered');
  const [canvasNoise, setCanvasNoise] = useState(false);
  const [audioNoise, setAudioNoise] = useState(false);

  // Accordion UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const [proxyLoading, setProxyLoading] = useState(false);

  const handleGetFreeProxy = async () => {
    try {
      setProxyLoading(true);
      const data = await ApiService.fetchFreeProxy();
      setProxyHost(data.host);
      setProxyPort(data.port.toString());
      setProxyUser('');
      setProxyPass('');
    } catch (err: any) {
      alert(`Gagal mengambil proxy gratis: ${err.message || err}`);
    } finally {
      setProxyLoading(false);
    }
  };

  // Check backend server connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const apiHost = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';
        const res = await fetch(`http://${apiHost}:4000/api/profiles`);
        if (res.ok) setBackendOnline(true);
      } catch (e) {
        setBackendOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const randomizeFingerprints = () => {
    // Pick random UA preset (excluding custom)
    const uaOptions = UA_PRESETS.filter(p => p.value !== 'custom');
    const randomUa = uaOptions[Math.floor(Math.random() * uaOptions.length)].value;
    setSelectedUa(randomUa);

    // Pick random resolution
    const resOptions = ['1920x1080', '1536x864', '1440x900', '1366x768'];
    const randomRes = resOptions[Math.floor(Math.random() * resOptions.length)];
    setScreenResolution(randomRes);

    // Pick random GPU WebGL Vendor
    const gpuOptions = [
      'Google Inc. (NVIDIA)',
      'Google Inc. (Intel)',
      'Google Inc. (ATI Technologies Inc.)',
      'Apple Inc. (Apple M2)'
    ];
    const randomGpu = gpuOptions[Math.floor(Math.random() * gpuOptions.length)];
    setWebGLVendor(randomGpu);

    // Set defaults
    setTimezone('auto');
    setWebrtcMode('altered');
    setCanvasNoise(false);
    setAudioNoise(false);
  };

  // Run on mount to pre-populate randomized fingerprints
  useEffect(() => {
    randomizeFingerprints();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const userAgentValue = selectedUa === 'custom' ? customUa : selectedUa;

    const payload = {
      name: profileName.trim(),
      proxy_host: proxyHost.trim() || null,
      proxy_port: proxyPort.trim() ? parseInt(proxyPort.trim(), 10) : null,
      proxy_user: proxyUser.trim() || null,
      proxy_pass: proxyPass.trim() || null,
      user_agent: userAgentValue,
      screen_resolution: screenResolution,
      webgl_vendor: webglVendor,
      timezone: timezone,
      webrtc_mode: webrtcMode,
      canvas_noise: canvasNoise ? 'enabled' : 'disabled',
      audio_noise: audioNoise ? 'enabled' : 'disabled',
      notes: profileNotes.trim() || undefined
    };

    try {
      await createProfile(payload);
      // Reset form text fields on success
      setProfileName('');
      setProfileNotes('');
      setProxyHost('');
      setProxyPort('');
      setProxyUser('');
      setProxyPass('');
      setCanvasNoise(false);
      setAudioNoise(false);
      // Generate a fresh random fingerprint for the next profile
      randomizeFingerprints();
    } catch (err) {
      console.error('Failed to create profile:', err);
    }
  };

  const startEditingNotes = (id: string, currentNotes: string) => {
    setEditingNotesId(id);
    setTempNotesValue(currentNotes || '');
  };

  const saveNotes = async (id: string) => {
    try {
      await updateProfileNotes(id, tempNotesValue.trim());
      setEditingNotesId(null);
    } catch (e) {
      console.error('Failed to save profile notes:', e);
    }
  };

  const openCookiesModal = async (profile: Profile) => {
    setActiveCookiesProfile(profile);
    setIsCookiesModalOpen(true);
    setCookiesModalTab('view');
    setCookieImportText('');
    setCookiesError(null);
    await refreshCookies(profile.id);
  };

  const refreshCookies = async (profileId: string) => {
    try {
      setCookiesLoading(true);
      setCookiesError(null);
      const cookies = await ApiService.getProfileCookies(profileId);
      setCookiesList(cookies);
    } catch (e: any) {
      setCookiesError(e.message || 'Failed to fetch cookies');
    } finally {
      setCookiesLoading(false);
    }
  };

  const handleImportCookies = async () => {
    if (!activeCookiesProfile) return;
    try {
      setCookiesLoading(true);
      setCookiesError(null);
      let parsedCookies: any[];
      try {
        parsedCookies = JSON.parse(cookieImportText.trim());
        if (!Array.isArray(parsedCookies)) {
          throw new Error('Cookies must be a JSON array of cookie objects.');
        }
      } catch (err: any) {
        throw new Error(`Invalid JSON format: ${err.message}`);
      }

      await ApiService.setProfileCookies(activeCookiesProfile.id, parsedCookies);
      setCookieImportText('');
      await refreshCookies(activeCookiesProfile.id);
      setCookiesModalTab('view');
    } catch (e: any) {
      setCookiesError(e.message || 'Failed to import cookies');
    } finally {
      setCookiesLoading(false);
    }
  };

  const handleExportCookies = () => {
    if (!activeCookiesProfile || cookiesList.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cookiesList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeCookiesProfile.name.toLowerCase().replace(/\s+/g, '_')}_cookies.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getOSFromUA = (ua: string) => {
    if (!ua) return 'Windows';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS X')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Generic';
  };

  const getBrowserFromUA = (ua: string) => {
    if (!ua) return 'Chrome';
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
    return 'Chrome';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-glow" />
          <h1 className="brand-title">multibrosergo</h1>
        </div>
        <div className="status-badge">
          <span className={`status-dot ${backendOnline ? 'online' : 'offline'}`} style={{ backgroundColor: backendOnline ? '#10b981' : '#f43f5e', boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e' }} />
          {backendOnline ? 'API Sidecar Connected' : 'Connecting to Sidecar API...'}
        </div>
      </header>

      {/* Main dashboard grid */}
      <div className="dashboard-grid">
        
        {/* Left column: Creator Form */}
        <section className="glass-panel">
          <h2 className="panel-title">
            <span>Profile Creator</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary-color)' }}>ID-GEN ACTIVE</span>
          </h2>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Profile Name */}
            <div className="form-group">
              <label htmlFor="name">Profile Name</label>
              <input 
                id="name"
                type="text" 
                placeholder="e.g. Shopee Buyer #1" 
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
            </div>

            {/* Account Usage / Notes */}
            <div className="form-group">
              <label htmlFor="notes">Account Usage / Notes (Optional)</label>
              <input 
                id="notes"
                type="text" 
                placeholder="e.g. Used for Google Ad Account #3" 
                value={profileNotes}
                onChange={(e) => setProfileNotes(e.target.value)}
              />
            </div>

            {/* Proxy Setup */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 className="form-section-title" style={{ margin: 0 }}>Network & Proxy</h3>
                <button 
                  type="button"
                  className="btn"
                  onClick={handleGetFreeProxy}
                  disabled={proxyLoading || !backendOnline}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    color: 'var(--success-color)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    lineHeight: 1
                  }}
                  title="Get Random Free HTTP Proxy"
                >
                  {proxyLoading ? '🔄 Fetching...' : '🎲 Auto Proxy'}
                </button>
              </div>
              <div className="form-group-grid two-cols">
                <div className="form-group">
                  <label htmlFor="proxy-host">Proxy Host</label>
                  <input 
                    id="proxy-host"
                    type="text" 
                    placeholder="127.0.0.1" 
                    value={proxyHost}
                    onChange={(e) => setProxyHost(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="proxy-port">Proxy Port</label>
                  <input 
                    id="proxy-port"
                    type="text" 
                    placeholder="8080" 
                    value={proxyPort}
                    onChange={(e) => setProxyPort(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="form-group-grid two-cols" style={{ marginTop: '0.75rem' }}>
                <div className="form-group">
                  <label htmlFor="proxy-user">Proxy User</label>
                  <input 
                    id="proxy-user"
                    type="text" 
                    placeholder="Optional" 
                    value={proxyUser}
                    onChange={(e) => setProxyUser(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="proxy-pass">Proxy Password</label>
                  <input 
                    id="proxy-pass"
                    type="password" 
                    placeholder="Optional" 
                    value={proxyPass}
                    onChange={(e) => setProxyPass(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Advanced Fingerprints Accordion */}
            <div>
              <div className="accordion-header" onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-section-title" style={{ margin: 0 }}>Advanced Fingerprints</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      randomizeFingerprints();
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      color: 'var(--primary-color)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px'
                    }}
                    title="Generate New Random Fingerprint"
                  >
                    🎲 Re-Roll
                  </button>
                  <span className={`accordion-icon ${showAdvanced ? 'open' : ''}`}>▼</span>
                </div>
              </div>

              {showAdvanced && (
                <div className="accordion-content">
                  
                  {/* User Agent */}
                  <div className="form-group">
                    <label htmlFor="ua-select">User Agent Profile</label>
                    <select 
                      id="ua-select"
                      value={selectedUa}
                      onChange={(e) => setSelectedUa(e.target.value)}
                    >
                      {UA_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedUa === 'custom' && (
                    <div className="form-group" style={{ animation: 'slideDown 0.2s ease' }}>
                      <label htmlFor="custom-ua">Custom User Agent String</label>
                      <input 
                        id="custom-ua"
                        type="text" 
                        value={customUa}
                        onChange={(e) => setCustomUa(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Resolution */}
                  <div className="form-group">
                    <label htmlFor="resolution">Screen Resolution</label>
                    <select 
                      id="resolution"
                      value={screenResolution}
                      onChange={(e) => setScreenResolution(e.target.value)}
                    >
                      <option value="1920x1080">1920 x 1080 (16:9 Desktop)</option>
                      <option value="1536x864">1536 x 864</option>
                      <option value="1440x900">1440 x 900 (Mac Air/Pro)</option>
                      <option value="1366x768">1366 x 768</option>
                      <option value="2560x1440">2560 x 1440 (2K WQHD)</option>
                    </select>
                  </div>

                  {/* WebGL GPU Vendor */}
                  <div className="form-group">
                    <label htmlFor="webgl">WebGL GPU Spoofing</label>
                    <select 
                      id="webgl"
                      value={webglVendor}
                      onChange={(e) => setWebGLVendor(e.target.value)}
                    >
                      <option value="Google Inc. (NVIDIA)">NVIDIA GeForce RTX 4070 (Realistic)</option>
                      <option value="Google Inc. (Intel)">Intel Iris Xe Graphics (Office PC)</option>
                      <option value="Google Inc. (ATI Technologies Inc.)">AMD Radeon RX 6600</option>
                      <option value="Apple Inc. (Apple M2)">Apple M2 GPU Cores (macOS Style)</option>
                    </select>
                  </div>

                  {/* Timezone */}
                  <div className="form-group">
                    <label htmlFor="timezone">Timezone Emulation</label>
                    <select 
                      id="timezone"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="auto">Auto Sync (Matches Proxy IP Address)</option>
                      <option value="UTC">UTC (Universal Coordinated Time)</option>
                      <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                    </select>
                  </div>

                  {/* WebRTC */}
                  <div className="form-group">
                    <label htmlFor="webrtc">WebRTC Connection Mode</label>
                    <select 
                      id="webrtc"
                      value={webrtcMode}
                      onChange={(e) => setWebrtcMode(e.target.value)}
                    >
                      <option value="altered">Altered (Emulate / Spoof Local IP)</option>
                      <option value="blocked">Disabled (Block entire WebRTC leak)</option>
                      <option value="bypass">Direct (Share actual system IP)</option>
                    </select>
                  </div>

                  {/* Canvas & Audio Toggles */}
                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem', padding: '0 0.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        id="canvas-noise"
                        type="checkbox"
                        checked={canvasNoise}
                        onChange={(e) => setCanvasNoise(e.target.checked)}
                        style={{ width: 'auto', height: 'auto', cursor: 'pointer', margin: 0 }}
                      />
                      <label htmlFor="canvas-noise" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Canvas Spoofing</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        id="audio-noise"
                        type="checkbox"
                        checked={audioNoise}
                        onChange={(e) => setAudioNoise(e.target.checked)}
                        style={{ width: 'auto', height: 'auto', cursor: 'pointer', margin: 0 }}
                      />
                      <label htmlFor="audio-noise" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Audio Spoofing</label>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Error inside Form */}
            {error && (
              <div className="error-alert">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !profileName.trim() || !backendOnline}
            >
              {!backendOnline 
                ? '🔌 Sidecar Offline' 
                : loading 
                  ? '🔄 Loading...' 
                  : 'Create Profile Card'}
            </button>
          </form>
        </section>

        {/* Right column: Dashboard List */}
        <section className="glass-panel">
          <div className="profiles-header">
            <h2 className="panel-title" style={{ border: 'none', padding: 0 }}>Active Profile Roster</h2>
            <span className="profile-count">{profiles.length} Active {profiles.length === 1 ? 'Profile' : 'Profiles'}</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '1rem', fontStyle: 'italic' }}>Retrieving local database...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="empty-state">
              <h3>No Profiles Available</h3>
              <p style={{ fontSize: '0.9rem' }}>Use the creator form on the left to set up your first anti-detect browser container.</p>
            </div>
          ) : (
            <div className="profiles-grid">
              {profiles.map((profile) => {
                const isProxyActive = !!(profile.proxy_host && profile.proxy_port);
                const os = getOSFromUA(profile.user_agent);
                const browser = getBrowserFromUA(profile.user_agent);

                return (
                  <div className="profile-card" key={profile.id}>
                    <div className="profile-card-header">
                      <div className="profile-info">
                        <div className="profile-name">{profile.name}</div>
                        <div className="profile-date">
                          Created: {new Date(profile.created_at).toLocaleDateString()} at {new Date(profile.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <span className="os-badge">
                        {os} • {browser}
                      </span>
                    </div>

                    {/* Network Details */}
                    <div className={`proxy-summary ${isProxyActive ? 'active' : ''}`}>
                      <span>🌐</span>
                      {isProxyActive ? (
                        <span>
                          PROXY: {profile.proxy_host}:{profile.proxy_port} 
                          {profile.proxy_user ? ` (${profile.proxy_user})` : ''}
                        </span>
                      ) : (
                        <span>DIRECT CONNECTION (NO PROXY)</span>
                      )}
                    </div>

                    {/* Geolocation Details */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="os-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)', textTransform: 'none' }}>
                        📍 {profile.country || 'Local'}
                      </span>
                      <span className="os-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', textTransform: 'none' }}>
                        IP: {profile.ip_address || 'Direct'}
                      </span>
                    </div>

                    {/* Notes / Account Tagging */}
                    <div className="profile-notes-section" style={{
                      marginTop: '0.75rem',
                      padding: '0.65rem 0.8rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderLeft: '3px solid var(--primary-color)',
                      borderRight: '1px solid rgba(255, 255, 255, 0.03)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {editingNotesId === profile.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <textarea
                            value={tempNotesValue}
                            onChange={(e) => setTempNotesValue(e.target.value)}
                            placeholder="e.g. Google Ads #3 / Used for Facebook Account"
                            style={{
                              width: '100%',
                              minHeight: '50px',
                              backgroundColor: 'rgba(0, 0, 0, 0.25)',
                              color: '#fff',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '4px',
                              padding: '0.4rem',
                              fontSize: '0.8rem',
                              resize: 'vertical',
                              outline: 'none',
                              fontFamily: 'inherit'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              onClick={() => setEditingNotesId(null)}
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="button"
                              onClick={() => saveNotes(profile.id)}
                              className="btn btn-primary"
                              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#10b981', border: '1px solid #059669' }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: profile.notes ? 'normal' : 'italic', wordBreak: 'break-word', fontSize: '0.8rem', flex: 1 }}>
                            {profile.notes ? (
                              <span>📌 <strong>Usage:</strong> {profile.notes}</span>
                            ) : (
                              <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>✏️ Add usage notes (e.g. Shopee, Gmail)...</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditingNotes(profile.id, profile.notes || '')}
                            style={{
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                              borderRadius: '4px',
                              color: 'var(--primary-color)',
                              cursor: 'pointer',
                              padding: '0.15rem 0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Fingerprint List */}
                    <div className="fingerprint-bullets">
                      <div className="bullet-item">
                        <span className="bullet-label">WebGL Renderer</span>
                        <span className="bullet-val">{profile.webgl_vendor}</span>
                      </div>
                      <div className="bullet-item">
                        <span className="bullet-label">Timezone</span>
                        <span className="bullet-val">
                          {profile.timezone === 'auto' ? 'Auto (IP Sync)' : profile.timezone}
                        </span>
                      </div>
                      <div className="bullet-item">
                        <span className="bullet-label">Resolution</span>
                        <span className="bullet-val">{profile.screen_resolution}</span>
                      </div>
                      <div className="bullet-item">
                        <span className="bullet-label">WebRTC</span>
                        <span className="bullet-val" style={{ textTransform: 'capitalize' }}>
                          {profile.webrtc_mode}
                        </span>
                      </div>
                      <div className="bullet-item">
                        <span className="bullet-label">Canvas Spoof</span>
                        <span className="bullet-val">
                          {profile.canvas_noise === 'enabled' ? '🟢 ON' : '❌ OFF'}
                        </span>
                      </div>
                      <div className="bullet-item">
                        <span className="bullet-label">Audio Spoof</span>
                        <span className="bullet-val">
                          {profile.audio_noise === 'enabled' ? '🟢 ON' : '❌ OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="profile-card-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-launch" 
                        onClick={() => launchProfile(profile.id)}
                        style={{ flex: 2, minWidth: '120px' }}
                      >
                        🚀 Launch Browser
                      </button>
                      <button 
                        type="button"
                        className="btn" 
                        title="Manage Cookies"
                        onClick={() => openCookiesModal(profile)}
                        style={{ 
                          flex: 1.2, 
                          minWidth: '85px',
                          background: 'rgba(251, 191, 36, 0.12)',
                          border: '1px solid rgba(251, 191, 36, 0.22)',
                          color: '#fbbf24',
                          fontWeight: 500
                        }}
                      >
                        🍪 Cookies
                      </button>
                      <button 
                        className="btn btn-delete btn-icon-only" 
                        title="Delete Profile"
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete profile "${profile.name}"?`)) {
                            deleteProfile(profile.id);
                          }
                        }}
                        style={{ width: '38px', minWidth: '38px' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Cookie Manager Modal */}
      {isCookiesModalOpen && activeCookiesProfile && (
        <div style={{
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
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '750px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>🍪 Cookie Manager</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  Managing session keys for profile: <strong>{activeCookiesProfile.name}</strong>
                </div>
              </div>
              <button 
                onClick={() => setIsCookiesModalOpen(false)}
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
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
              <button 
                onClick={() => setCookiesModalTab('view')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: cookiesModalTab === 'view' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: cookiesModalTab === 'view' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  color: cookiesModalTab === 'view' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                View Cookies ({cookiesList.length})
              </button>
              <button 
                onClick={() => setCookiesModalTab('import')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: cookiesModalTab === 'import' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: cookiesModalTab === 'import' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  color: cookiesModalTab === 'import' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                Import Cookies
              </button>
              <button 
                onClick={() => setCookiesModalTab('export')}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: cookiesModalTab === 'export' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: cookiesModalTab === 'export' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  color: cookiesModalTab === 'export' ? 'var(--primary-color)' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                Export Cookies
              </button>
            </div>

            {/* Error alerts inside Modal */}
            {cookiesError && (
              <div className="error-alert" style={{ marginBottom: '1rem' }}>
                <span>⚠</span>
                <span>{cookiesError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '250px' }}>
              {cookiesLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-secondary)' }}>
                  <div className="status-dot online" style={{ width: '12px', height: '12px', marginBottom: '0.5rem' }} />
                  <div>Processing cookies... (Puppeteer Headless running)</div>
                </div>
              ) : cookiesModalTab === 'view' ? (
                cookiesList.length === 0 ? (
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
                        {cookiesList.map((cookie, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.5rem', color: '#a5b4fc', fontWeight: 500 }}>{cookie.domain}</td>
                            <td style={{ padding: '0.5rem', color: '#fff' }}>{cookie.name}</td>
                            <td style={{ padding: '0.5rem', color: 'rgba(255, 255, 255, 0.5)', fontFamily: 'monospace' }}>
                              {cookie.value.length > 25 ? `${cookie.value.substring(0, 25)}...` : cookie.value}
                            </td>
                            <td style={{ padding: '0.5rem' }}>{cookie.secure ? '🔒 Yes' : 'No'}</td>
                            <td style={{ padding: '0.5rem' }}>{cookie.httpOnly ? '🛡️ Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : cookiesModalTab === 'import' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Paste cookie JSON array below:</label>
                  <textarea 
                    value={cookieImportText}
                    onChange={(e) => setCookieImportText(e.target.value)}
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
                      outline: 'none'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button 
                      type="button"
                      onClick={handleImportCookies}
                      className="btn btn-primary"
                      disabled={!cookieImportText.trim() || cookiesLoading}
                      style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', backgroundColor: 'var(--primary-color)' }}
                    >
                      📥 Import Sesi Cookies
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
                    onClick={handleExportCookies}
                    className="btn"
                    disabled={cookiesList.length === 0}
                    style={{
                      padding: '0.6rem 1.5rem',
                      fontSize: '0.85rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: 600
                    }}
                  >
                    💾 Download JSON Cookies ({cookiesList.length} items)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
