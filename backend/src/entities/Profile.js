/**
 * Profile Entity
 * Represents the core domain model for a Browser Profile.
 */
class Profile {
  constructor({
    id, name, proxy_host, proxy_port, proxy_user, proxy_pass,
    user_agent, screen_resolution, webgl_vendor, timezone, webrtc_mode, created_at,
    ip_address, country, canvas_noise, audio_noise, latitude, longitude, notes
  }) {
    this.id = id;
    this.name = name;
    this.proxy_host = proxy_host;
    this.proxy_port = proxy_port;
    this.proxy_user = proxy_user;
    this.proxy_pass = proxy_pass;
    this.user_agent = user_agent;
    this.screen_resolution = screen_resolution;
    this.webgl_vendor = webgl_vendor;
    this.timezone = timezone;
    this.webrtc_mode = webrtc_mode;
    this.created_at = created_at;
    this.ip_address = ip_address;
    this.country = country;
    this.canvas_noise = canvas_noise;
    this.audio_noise = audio_noise;
    this.latitude = latitude;
    this.longitude = longitude;
    this.notes = notes;
  }
}

module.exports = Profile;
