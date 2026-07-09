import { Profile, CreateProfileDto, CookieItem } from '../types/Profile';

function resolveApiHost(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const hostname = typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';
  const protocol = import.meta.env.VITE_API_PROTOCOL || 'http';
  return `${protocol}://${hostname}:4000/api/profiles`;
}

const API_BASE_URL = resolveApiHost();
const PROXY_API_BASE_URL = API_BASE_URL.replace(/\/api\/profiles$/, '/api/proxy');

export const ApiService = {
  async getAllProfiles(): Promise<Profile[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch profiles: ${response.statusText}`);
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
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to create profile: ${response.statusText}`);
    }
    return response.json();
  },

  async launchProfile(id: string): Promise<{ message: string; profileId: string }> {
    const response = await fetch(`${API_BASE_URL}/${id}/launch`, {
      method: 'POST',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to launch profile: ${response.statusText}`);
    }
    return response.json();
  },

  async closeProfile(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/close`, {
      method: 'POST',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to close profile: ${response.statusText}`);
    }
  },

  async deleteProfile(id: string): Promise<{ message: string; id: string }> {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to delete profile: ${response.statusText}`);
    }
    return response.json();
  },

  async fetchFreeProxy(): Promise<{ host: string; port: number }> {
    const response = await fetch(`${PROXY_API_BASE_URL}/free-proxy`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch free proxy: ${response.statusText}`);
    }
    return response.json();
  },

  async updateProfileNotes(id: string, notes: string): Promise<Profile> {
    const response = await fetch(`${API_BASE_URL}/${id}/notes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to update notes: ${response.statusText}`);
    }
    return response.json();
  },

  async getProfileCookies(id: string): Promise<CookieItem[]> {
    const response = await fetch(`${API_BASE_URL}/${id}/cookies`);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to fetch cookies: ${response.statusText}`);
    }
    return response.json();
  },

  async setProfileCookies(id: string, cookies: CookieItem[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/cookies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookies }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error || `Failed to import cookies: ${response.statusText}`);
    }
  },
};
