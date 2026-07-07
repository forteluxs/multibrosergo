# multibrosergo 🚀

**multibrosergo** is a premium, lightweight, and modern **Anti-Detect (Multi-Accounting) Browser Manager** built with React, TypeScript, Node.js (Express), and Puppeteer-Extra. It allows you to create, manage, and launch multiple isolated Chromium browser profiles simultaneously—each with its own digital fingerprint and proxy routing to prevent bot detection and account suspension.

---

## 🌟 Key Features

*   **Sleek Dark Glassmorphic UI:** A premium, fully responsive grid dashboard featuring real-time connection status monitoring, descriptive form labels, and interactive action buttons.
*   **Persistent Profile Sessions:** Every browser profile stores its cookies, local storage, history, and cache in an isolated directory (`~/.multibrowser/profiles/<id>`). You stay logged in to your accounts across browser restarts.
*   **Advanced Fingerprint Spoofing:**
    *   **User-Agent Presets:** Quick selection of realistic Windows Chrome, Edge, macOS Safari, macOS Chrome, and Linux Firefox User-Agents.
    *   **Screen Resolution Viewport:** Emulates exact monitor widths/heights inside standard viewport objects and CDP (Chrome DevTools Protocol) variables.
    *   **WebGL GPU Spoofing:** Simulates graphic card renderers (e.g., NVIDIA GeForce RTX 4070, Apple M2, AMD Radeon, Intel Iris Xe) preventing hardware tracking.
    *   **Canvas & Audio Noise Toggles:** Safe, subtle noise injection to obfuscate canvas/audio hashes (disabled by default for Google to prevent IP flagging, togglable for maximum security elsewhere).
    *   **WebRTC IP Leak Protection:** Configurable modes (`altered`, `blocked`, or `bypass`) to secure your local IP address.
*   **Intelligent HTTP Proxy Verification:**
    *   **Automatic Free Proxies:** "Auto Proxy" button fetches public proxies from an anonymous list in real-time.
    *   **Active HTTPS Tunnel Check:** Backend tests up to 25 proxies in parallel using raw TCP `CONNECT` handshakes to `www.google.com:443`, guaranteeing the proxy supports SSL traffic (preventing `ERR_EMPTY_RESPONSE` pages).
    *   **Proxy Timezone Sync:** Emulates the timezone (`Asia/Jakarta`, `America/New_York`, etc.) corresponding to the proxy's IP geolocational zone automatically.
*   **Automatic CAPTCHA Solver Integration:** Unpacked browser extensions (such as **Buster** - the open-source audio reCAPTCHA solver using Speech-to-Text) placed inside `backend/extensions/` are automatically scanned and injected into every launched Chromium instance.
*   **Geolocation Country & IP Tracking:** Dynamically resolves the proxy IP location (Country & Host IP) using geolocation API lookups, saving and rendering them as badges directly in your profile dashboard.

---

## 📂 Project Structure

```
multibrosergo/
├── backend/                   # Node.js + Express + Puppeteer-extra sidecar API
│   ├── extensions/            # Folder for auto-injected browser extensions (e.g. Buster)
│   ├── src/
│   │   ├── controllers/       # Controller handling requests
│   │   ├── entities/          # Domain Models (Profile)
│   │   ├── repositories/      # SQLite Data Layer
│   │   ├── routes/            # REST Endpoints
│   │   └── services/          # Business logic & Puppeteer browser controllers
│   └── server.js              # Backend Entry Point (Port 4000)
├── database/                  # SQLite Initialization scripts
├── ui/                        # React + Vite + TS + Tauri Client (Frontend)
│   ├── src/                   # React components, custom hooks, CSS, and API services
│   └── src-tauri/             # Tauri desktop wrapper (Rust)
└── start-app.sh               # Executable startup shell script
```

---

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (Version 18.x or higher)
*   [npm](https://www.npmjs.com/)

### Quick Run (Bilingual/All-in-one Bootstrapper)

The easiest way to start the application is by using the pre-configured startup shell script in the root directory:

```bash
# Make the script executable (only needed once)
chmod +x start-app.sh

# Start the entire application
./start-app.sh
```

This script will automatically:
1.  Check for Node.js.
2.  Install Puppeteer Chrome binaries to your cache folder if missing.
3.  Kill any old processes hanging on ports 4000/1420.
4.  Launch the Express Backend (`http://localhost:4000`).
5.  Launch the Vite Dev Server (`http://localhost:1420`).

Open **[http://localhost:1420/](http://localhost:1420/)** in your browser to access the dashboard!

---

## 🛠️ Stopping the Servers

To shut down the background processes started by the bootstrapper, run the `kill` command displayed in the terminal at startup, or run:

```bash
# Terminate ports 4000 and 1420
fuser -k 4000/tcp
fuser -k 1420/tcp
```

## 🛡️ License

This project is open-source and available under the MIT License.
