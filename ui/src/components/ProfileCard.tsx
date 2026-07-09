import React, { useState } from 'react';
import { Profile } from '../types/Profile';
import { getOSFromUA, getBrowserFromUA } from '../constants';

interface ProfileCardProps {
  profile: Profile;
  editingNotesId: string | null;
  onStartEditingNotes: (id: string, currentNotes: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onCancelEditingNotes: () => void;
  onLaunch: (id: string) => void;
  onOpenCookies: (profile: Profile) => void;
  onDelete: (id: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  editingNotesId,
  onStartEditingNotes,
  onSaveNotes,
  onCancelEditingNotes,
  onLaunch,
  onOpenCookies,
  onDelete,
}) => {
  const [tempNotes, setTempNotes] = useState('');
  const isProxyActive = !!(profile.proxy_host && profile.proxy_port);
  const os = getOSFromUA(profile.user_agent);
  const browser = getBrowserFromUA(profile.user_agent);
  const isEditing = editingNotesId === profile.id;

  const handleSaveNotes = async () => {
    try {
      await onSaveNotes(profile.id, tempNotes.trim());
    } catch {
      console.error('Failed to save notes');
    }
  };

  const startEditing = () => {
    setTempNotes(profile.notes || '');
    onStartEditingNotes(profile.id, profile.notes || '');
  };

  const formatDate = (iso: string): string => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 'Unknown date';
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <div className="profile-info">
          <div className="profile-name">{profile.name}</div>
          <div className="profile-date">Created: {formatDate(profile.created_at)}</div>
        </div>
        <span className="os-badge">{os}  {browser}</span>
      </div>

      <div className={`proxy-summary ${isProxyActive ? 'active' : ''}`}>
        <span>Network</span>
        {isProxyActive ? (
          <span>
            PROXY: {profile.proxy_host}:{profile.proxy_port}
            {profile.proxy_user ? ` (${profile.proxy_user})` : ''}
          </span>
        ) : (
          <span>DIRECT CONNECTION (NO PROXY)</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="os-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)', textTransform: 'none' }}>
          Location: {profile.country || 'Local'}
        </span>
        <span className="os-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.25)', textTransform: 'none' }}>
          IP: {profile.ip_address || 'Direct'}
        </span>
      </div>

      <div className="profile-notes-section" style={{
        marginTop: '0.75rem',
        padding: '0.65rem 0.8rem',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderLeft: '3px solid var(--primary-color)',
        borderRight: '1px solid rgba(255, 255, 255, 0.03)',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
        borderRadius: '4px',
        fontSize: '0.85rem',
      }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <textarea
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
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
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onCancelEditingNotes} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSaveNotes} className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', backgroundColor: '#10b981', border: '1px solid #059669' }}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: profile.notes ? 'normal' : 'italic', wordBreak: 'break-word', fontSize: '0.8rem', flex: 1 }}>
              {profile.notes ? (
                <span>Usage: {profile.notes}</span>
              ) : (
                <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>Add usage notes (e.g. Shopee, Gmail)...</span>
              )}
            </div>
            <button
              type="button"
              onClick={startEditing}
              style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '4px',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                padding: '0.15rem 0.4rem',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="fingerprint-bullets">
        <div className="bullet-item">
          <span className="bullet-label">WebGL Renderer</span>
          <span className="bullet-val">{profile.webgl_vendor}</span>
        </div>
        <div className="bullet-item">
          <span className="bullet-label">Timezone</span>
          <span className="bullet-val">{profile.timezone === 'auto' ? 'Auto (IP Sync)' : profile.timezone}</span>
        </div>
        <div className="bullet-item">
          <span className="bullet-label">Resolution</span>
          <span className="bullet-val">{profile.screen_resolution}</span>
        </div>
        <div className="bullet-item">
          <span className="bullet-label">WebRTC</span>
          <span className="bullet-val" style={{ textTransform: 'capitalize' }}>{profile.webrtc_mode}</span>
        </div>
        <div className="bullet-item">
          <span className="bullet-label">Canvas Spoof</span>
          <span className="bullet-val">{profile.canvas_noise === 'enabled' ? 'ON' : 'OFF'}</span>
        </div>
        <div className="bullet-item">
          <span className="bullet-label">Audio Spoof</span>
          <span className="bullet-val">{profile.audio_noise === 'enabled' ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      <div className="profile-card-actions" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button className="btn btn-launch" onClick={() => onLaunch(profile.id)} style={{ flex: 2, minWidth: '120px' }}>
          Launch Browser
        </button>
        <button
          type="button"
          className="btn"
          title="Manage Cookies"
          onClick={() => onOpenCookies(profile)}
          style={{
            flex: 1.2,
            minWidth: '85px',
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.22)',
            color: '#fbbf24',
            fontWeight: 500,
          }}
        >
          Cookies
        </button>
        <button
          className="btn btn-delete btn-icon-only"
          title="Delete Profile"
          onClick={() => {
            if (confirm(`Are you sure you want to permanently delete profile "${profile.name}"?`)) {
              onDelete(profile.id);
            }
          }}
          style={{ width: '38px', minWidth: '38px' }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
