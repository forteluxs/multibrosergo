import React from 'react';

interface HeaderProps {
  backendOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ backendOnline }) => (
  <header className="app-header">
    <div className="brand-section">
      <div className="brand-logo-glow" />
      <h1 className="brand-title">multibrosergo</h1>
    </div>
    <div className="status-badge">
      <span
        className={`status-dot ${backendOnline ? 'online' : 'offline'}`}
        aria-label={backendOnline ? 'Backend connected' : 'Backend disconnected'}
        style={{
          backgroundColor: backendOnline ? '#10b981' : '#f43f5e',
          boxShadow: backendOnline ? '0 0 8px #10b981' : '0 0 8px #f43f5e',
        }}
      />
      {backendOnline ? 'API Sidecar Connected' : 'Connecting to Sidecar API...'}
    </div>
  </header>
);
