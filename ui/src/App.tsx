import { useState, useEffect, useCallback } from 'react';
import { useProfiles } from './hooks/useProfiles';
import { ApiService } from './services/apiService';
import { Profile } from './types/Profile';
import { Header } from './components/Header';
import { ProfileCreatorForm } from './components/ProfileCreatorForm';
import { ProfileList } from './components/ProfileList';
import { CookieManagerModal } from './components/CookieManagerModal';
import './App.css';

function App() {
  const {
    profiles,
    loading,
    error,
    createProfile,
    launchProfile,
    deleteProfile,
    updateProfileNotes,
  } = useProfiles();

  const [backendOnline, setBackendOnline] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [cookiesProfile, setCookiesProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await ApiService.getAllProfiles();
        if (!cancelled) setBackendOnline(true);
      } catch {
        if (!cancelled) setBackendOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const handleLaunch = useCallback(async (id: string) => {
    try {
      await launchProfile(id);
    } catch (err) {
      console.error('Launch failed:', err instanceof Error ? err.message : err);
    }
  }, [launchProfile]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteProfile(id);
    } catch (err) {
      console.error('Delete failed:', err instanceof Error ? err.message : err);
    }
  }, [deleteProfile]);

  const handleSaveNotes = useCallback(async (id: string, notes: string) => {
    await updateProfileNotes(id, notes);
    setEditingNotesId(null);
  }, [updateProfileNotes]);

  return (
    <div className="app-container">
      <Header backendOnline={backendOnline} />

      <div className="dashboard-grid">
        <ProfileCreatorForm
          backendOnline={backendOnline}
          loading={loading}
          globalError={error}
          onCreateProfile={createProfile}
        />

        {loading ? (
          <section className="glass-panel">
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <div style={{ marginBottom: '1rem', fontStyle: 'italic' }}>Retrieving local database...</div>
            </div>
          </section>
        ) : (
          <ProfileList
            profiles={profiles}
            editingNotesId={editingNotesId}
            onStartEditingNotes={(id) => setEditingNotesId(id)}
            onSaveNotes={handleSaveNotes}
            onCancelEditingNotes={() => setEditingNotesId(null)}
            onLaunch={handleLaunch}
            onOpenCookies={setCookiesProfile}
            onDelete={handleDelete}
          />
        )}
      </div>

      {cookiesProfile && (
        <CookieManagerModal
          profile={cookiesProfile}
          onClose={() => setCookiesProfile(null)}
        />
      )}
    </div>
  );
}

export default App;
