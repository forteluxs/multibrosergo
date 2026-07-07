export interface Profile {
  id: string;
  name: string;
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
