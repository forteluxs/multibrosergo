import React from 'react';
import { Profile } from '../types/Profile';
import { ProfileCard } from './ProfileCard';

interface ProfileListProps {
  profiles: Profile[];
  editingNotesId: string | null;
  onStartEditingNotes: (id: string, notes: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onCancelEditingNotes: () => void;
  onLaunch: (id: string) => void;
  onOpenCookies: (profile: Profile) => void;
  onDelete: (id: string) => void;
}

export const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  editingNotesId,
  onStartEditingNotes,
  onSaveNotes,
  onCancelEditingNotes,
  onLaunch,
  onOpenCookies,
  onDelete,
}) => (
  <section className="glass-panel">
    <div className="profiles-header">
      <h2 className="panel-title" style={{ border: 'none', padding: 0 }}>Active Profile Roster</h2>
      <span className="profile-count">{profiles.length} Active {profiles.length === 1 ? 'Profile' : 'Profiles'}</span>
    </div>

    {profiles.length === 0 ? (
      <div className="empty-state">
        <h3>No Profiles Available</h3>
        <p style={{ fontSize: '0.9rem' }}>Use the creator form on the left to set up your first anti-detect browser container.</p>
      </div>
    ) : (
      <div className="profiles-grid">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            editingNotesId={editingNotesId}
            onStartEditingNotes={onStartEditingNotes}
            onSaveNotes={onSaveNotes}
            onCancelEditingNotes={onCancelEditingNotes}
            onLaunch={onLaunch}
            onOpenCookies={onOpenCookies}
            onDelete={onDelete}
          />
        ))}
      </div>
    )}
  </section>
);
