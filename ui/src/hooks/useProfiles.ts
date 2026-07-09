import { useState, useEffect, useCallback } from 'react';
import { Profile, CreateProfileDto } from '../types/Profile';
import { ApiService } from '../services/apiService';

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiService.getAllProfiles();
      setProfiles(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = async (data: CreateProfileDto) => {
    setError(null);
    const newProfile = await ApiService.createProfile(data);
    setProfiles((prev) => [...prev, newProfile]);
  };

  const launchProfile = async (id: string) => {
    setError(null);
    await ApiService.launchProfile(id);
  };

  const closeProfile = async (id: string) => {
    setError(null);
    await ApiService.closeProfile(id);
  };

  const deleteProfile = async (id: string) => {
    setError(null);
    await ApiService.deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  };

  const updateProfileNotes = async (id: string, notes: string) => {
    setError(null);
    const updatedProfile = await ApiService.updateProfileNotes(id, notes);
    setProfiles((prev) => prev.map((p) => p.id === id ? updatedProfile : p));
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    loading,
    error,
    createProfile,
    launchProfile,
    closeProfile,
    deleteProfile,
    updateProfileNotes,
    refresh: fetchProfiles,
  };
}
