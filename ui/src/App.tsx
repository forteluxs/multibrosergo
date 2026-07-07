import React, { useState, useEffect } from 'react';
import { useProfiles } from './hooks/useProfiles';
import { ApiService } from './services/apiService';
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
  const { profiles, loading, error, createProfile, launchProfile, deleteProfile } = useProfiles();
  
  // Basic states
  const [profileName, setProfileName] = useState('');
  
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
      audio_noise: audioNoise ? 'enabled' : 'disabled'
    };

    try {
      await createProfile(payload);
      // Reset form text fields on success
      setProfileName('');
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
                    <div className="profile-card-actions">
                      <button 
                        className="btn btn-launch" 
                        onClick={() => launchProfile(profile.id)}
                      >
                        🚀 Launch Browser
                      </button>
                      <button 
                        className="btn btn-delete btn-icon-only" 
                        title="Delete Profile"
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete profile "${profile.name}"?`)) {
                            deleteProfile(profile.id);
                          }
                        }}
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
    </div>
  );
}

export default App;
