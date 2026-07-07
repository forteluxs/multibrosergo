import { Profile, CreateProfileDto } from '../types/Profile';

const apiHost = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${apiHost}:4000/api/profiles`;

/**
 * ApiService encapsulates all HTTP communications.
 * This ensures DRY and SoC principles.
 */
export const ApiService = {
  async getAllProfiles(): Promise<Profile[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch profiles: ${response.statusText}`);
    }
    return response.json();
  },

  async createProfile(data: CreateProfileDto): Promise<Profile> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to create profile: ${response.statusText}`);
    }
    return response.json();
  },

  async launchProfile(id: string): Promise<{ message: string; profileId: string }> {
    const response = await fetch(`${API_BASE_URL}/${id}/launch`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to launch profile: ${response.statusText}`);
    }
    return response.json();
  },

  async deleteProfile(id: string): Promise<{ message: string; id: string }> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete profile: ${response.statusText}`);
    }
    return response.json();
  },

  async fetchFreeProxy(): Promise<{ host: string; port: number }> {
    const response = await fetch(`${API_BASE_URL}/free-proxy`);
    if (!response.ok) {
      throw new Error(`Failed to fetch free proxy: ${response.statusText}`);
    }
    return response.json();
  }
};
