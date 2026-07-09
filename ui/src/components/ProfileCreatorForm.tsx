import React, { useState } from 'react';
import { UA_PRESETS, RESOLUTION_OPTIONS, GPU_OPTIONS } from '../constants';
import { ApiService } from '../services/apiService';
import { CreateProfileDto } from '../types/Profile';

interface ProfileCreatorFormProps {
  backendOnline: boolean;
  loading: boolean;
  globalError: string | null;
  onCreateProfile: (data: CreateProfileDto) => Promise<void>;
}

export const ProfileCreatorForm: React.FC<ProfileCreatorFormProps> = ({
  backendOnline,
  loading,
  globalError,
  onCreateProfile,
}) => {
  const [profileName, setProfileName] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');
  const [selectedUa, setSelectedUa] = useState(UA_PRESETS[0].value);
  const [customUa, setCustomUa] = useState(UA_PRESETS[0].value);
  const [screenResolution, setScreenResolution] = useState('1920x1080');
  const [webglVendor, setWebGLVendor] = useState('Google Inc. (NVIDIA)');
  const [timezone, setTimezone] = useState('auto');
  const [webrtcMode, setWebrtcMode] = useState('altered');
  const [canvasNoise, setCanvasNoise] = useState(false);
  const [audioNoise, setAudioNoise] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proxyLoading, setProxyLoading] = useState(false);

  const handleGetFreeProxy = async () => {
    try {
      setProxyLoading(true);
      const data = await ApiService.fetchFreeProxy();
      setProxyHost(data.host);
      setProxyPort(data.port.toString());
      setProxyUser('');
      setProxyPass('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[FreeProxy]', message);
    } finally {
      setProxyLoading(false);
    }
  };

  const randomizeFingerprints = () => {
    const uaOptions = UA_PRESETS.filter((p) => p.value !== 'custom');
    setSelectedUa(uaOptions[Math.floor(Math.random() * uaOptions.length)].value);
    setScreenResolution(RESOLUTION_OPTIONS[Math.floor(Math.random() * RESOLUTION_OPTIONS.length)]);
    setWebGLVendor(GPU_OPTIONS[Math.floor(Math.random() * GPU_OPTIONS.length)]);
    setTimezone('auto');
    setWebrtcMode('altered');
    setCanvasNoise(false);
    setAudioNoise(false);
  };

  const resetForm = () => {
    setProfileName('');
    setProfileNotes('');
    setProxyHost('');
    setProxyPort('');
    setProxyUser('');
    setProxyPass('');
    setCanvasNoise(false);
    setAudioNoise(false);
    randomizeFingerprints();
  };

  const parseProxyPort = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const num = parseInt(trimmed, 10);
    if (isNaN(num) || num < 1 || num > 65535) return null;
    return num;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    const userAgentValue = selectedUa === 'custom' ? customUa : selectedUa;

    const payload: CreateProfileDto = {
      name: profileName.trim(),
      proxy_host: proxyHost.trim() || undefined,
      proxy_port: parseProxyPort(proxyPort),
      proxy_user: proxyUser.trim() || undefined,
      proxy_pass: proxyPass.trim() || undefined,
      user_agent: userAgentValue,
      screen_resolution: screenResolution,
      webgl_vendor: webglVendor,
      timezone,
      webrtc_mode: webrtcMode,
      canvas_noise: canvasNoise ? 'enabled' : 'disabled',
      audio_noise: audioNoise ? 'enabled' : 'disabled',
      notes: profileNotes.trim() || undefined,
    };

    try {
      await onCreateProfile(payload);
      resetForm();
    } catch {
      console.error('Failed to create profile');
    }
  };

  return (
    <section className="glass-panel">
      <h2 className="panel-title">
        <span>Profile Creator</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--primary-color)' }}>ID-GEN ACTIVE</span>
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                lineHeight: 1,
              }}
              title="Get Random Free HTTP Proxy"
            >
              {proxyLoading ? 'Fetching...' : 'Auto Proxy'}
            </button>
          </div>
          <div className="form-group-grid two-cols">
            <div className="form-group">
              <label htmlFor="proxy-host">Proxy Host</label>
              <input id="proxy-host" type="text" placeholder="127.0.0.1" value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="proxy-port">Proxy Port</label>
              <input id="proxy-port" type="text" placeholder="8080" value={proxyPort} onChange={(e) => setProxyPort(e.target.value)} />
            </div>
          </div>

          <div className="form-group-grid two-cols" style={{ marginTop: '0.75rem' }}>
            <div className="form-group">
              <label htmlFor="proxy-user">Proxy User</label>
              <input id="proxy-user" type="text" placeholder="Optional" value={proxyUser} onChange={(e) => setProxyUser(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="proxy-pass">Proxy Password</label>
              <input id="proxy-pass" type="password" placeholder="Optional" value={proxyPass} onChange={(e) => setProxyPass(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <div className="accordion-header" onClick={() => setShowAdvanced(!showAdvanced)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="form-section-title" style={{ margin: 0 }}>Advanced Fingerprints</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={(ev) => { ev.stopPropagation(); randomizeFingerprints(); }}
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: 'var(--primary-color)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                }}
                title="Generate New Random Fingerprint"
              >
                Re-Roll
              </button>
              <span className={`accordion-icon ${showAdvanced ? 'open' : ''}`}>&#9660;</span>
            </div>
          </div>

          {showAdvanced && (
            <div className="accordion-content">
              <div className="form-group">
                <label htmlFor="ua-select">User Agent Profile</label>
                <select id="ua-select" value={selectedUa} onChange={(e) => setSelectedUa(e.target.value)}>
                  {UA_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
              </div>

              {selectedUa === 'custom' && (
                <div className="form-group" style={{ animation: 'slideDown 0.2s ease' }}>
                  <label htmlFor="custom-ua">Custom User Agent String</label>
                  <input id="custom-ua" type="text" value={customUa} onChange={(e) => setCustomUa(e.target.value)} />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="resolution">Screen Resolution</label>
                <select id="resolution" value={screenResolution} onChange={(e) => setScreenResolution(e.target.value)}>
                  {RESOLUTION_OPTIONS.map((r) => {
                    const [w, h] = r.split('x');
                    return (
                      <option key={r} value={r}>
                        {w} x {h} {r === '2560x1440' ? '(2K WQHD)' : r === '1920x1080' ? '(16:9 Desktop)' : r === '1440x900' ? '(Mac Air/Pro)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="webgl">WebGL GPU Spoofing</label>
                <select id="webgl" value={webglVendor} onChange={(e) => setWebGLVendor(e.target.value)}>
                  <option value="Google Inc. (NVIDIA)">NVIDIA GeForce RTX 4070 (Realistic)</option>
                  <option value="Google Inc. (Intel)">Intel Iris Xe Graphics (Office PC)</option>
                  <option value="Google Inc. (ATI Technologies Inc.)">AMD Radeon RX 6600</option>
                  <option value="Apple Inc. (Apple M2)">Apple M2 GPU Cores (macOS Style)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="timezone">Timezone Emulation</label>
                <select id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                  <option value="auto">Auto Sync (Matches Proxy IP Address)</option>
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="webrtc">WebRTC Connection Mode</label>
                <select id="webrtc" value={webrtcMode} onChange={(e) => setWebrtcMode(e.target.value)}>
                  <option value="altered">Altered (Emulate / Spoof Local IP)</option>
                  <option value="blocked">Disabled (Block entire WebRTC leak)</option>
                  <option value="bypass">Direct (Share actual system IP)</option>
                </select>
              </div>

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

        {globalError && (
          <div className="error-alert">
            <span>Warning</span>
            <span>{globalError}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || !profileName.trim() || !backendOnline}
        >
          {!backendOnline ? 'Sidecar Offline' : loading ? 'Loading...' : 'Create Profile Card'}
        </button>
      </form>
    </section>
  );
};
