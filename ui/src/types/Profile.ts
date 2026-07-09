export type DeviceType = 'desktop' | 'mobile_emulated' | 'android_real';

export interface Profile {
  id: string;
  name: string;
  device_type: DeviceType;
  proxy_host: string | null;
  proxy_port: number | null;
  proxy_user: string | null;
  proxy_pass: string | null;
  user_agent: string;
  screen_resolution: string;
  webgl_vendor: string;
  timezone: string;
  webrtc_mode: string;
  created_at: string;
  ip_address?: string;
  country?: string;
  canvas_noise?: string;
  audio_noise?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface CreateProfileDto {
  name: string;
  device_type?: DeviceType;
  proxy_host?: string | null;
  proxy_port?: number | null;
  proxy_user?: string | null;
  proxy_pass?: string | null;
  user_agent?: string;
  screen_resolution?: string;
  webgl_vendor?: string;
  timezone?: string;
  webrtc_mode?: string;
  canvas_noise?: string;
  audio_noise?: string;
  notes?: string;
}

export interface CookieItem {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  expirationDate?: number;
  expiry?: number;
  expires?: number;
}
