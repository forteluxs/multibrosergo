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
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = async (data: CreateProfileDto) => {
    try {
      setError(null);
      const newProfile = await ApiService.createProfile(data);
      setProfiles((prev) => [...prev, newProfile]);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
      throw err;
    }
  };

  const launchProfile = async (id: string) => {
    try {
      setError(null);
      await ApiService.launchProfile(id);
    } catch (err: any) {
      setError(err.message || 'Failed to launch profile');
      throw err;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      setError(null);
      await ApiService.deleteProfile(id);
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete profile');
      throw err;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return { profiles, loading, error, createProfile, launchProfile, deleteProfile, refresh: fetchProfiles };
}
