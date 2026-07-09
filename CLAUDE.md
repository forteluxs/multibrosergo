# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Full stack (dev):**
```bash
./start-app.sh              # installs deps, starts backend :4000 + Vite :1420
fuser -k 4000/tcp 1420/tcp  # shutdown
```

**Backend only:**
```bash
cd backend && node server.js           # start (needs NO_SANDBOX=true on Ubuntu 23.10+)
cd backend && node --watch server.js   # auto-reload
node -c <file>                          # quick syntax check (no test runner configured)
```

**Frontend only:**
```bash
cd ui && npm run dev        # Vite dev server on 1420
cd ui && npm run build      # tsc + vite build → ui/dist
cd ui && npm run tauri      # Tauri desktop wrapper (Rust — src-tauri/)
```

No unit/integration test runner is wired up (`backend/package.json` `test` script is a placeholder). Verify changes via curl against the API and manual UI smoke tests.

## Runtime environment gotchas

- **Ubuntu 23.10+ / kernel 6+**: Chromium sandbox fails with `No usable sandbox!` because unprivileged user namespaces are AppArmor-restricted. Backend reads `NO_SANDBOX=true` env var (see `backend/src/config.js`). `start-app.sh` sets it automatically; if launching backend directly, export it manually.
- **Puppeteer versions are exact-pinned** (`25.1.0`, `puppeteer-extra 3.3.6`, stealth `2.11.2`). Do **not** replace with `^` ranges — stealth plugin frequently breaks fingerprint spoofing across minor puppeteer bumps.
- **Chromium binary** is cached at `~/.cache/puppeteer/`. `start-app.sh` runs `npx puppeteer browsers install chrome` on first run.

## Architecture

### High-level flow

React UI (port 1420) → HTTP JSON → Express backend (port 4000) → Puppeteer → Chromium. Profiles persisted in SQLite (`backend/database/profiles.sqlite`). Per-profile Chromium `userDataDir` at `~/.multibrowser/profiles/<uuid>/` gives cookie/session/cache isolation.

### Backend layering (backend/src/)

Strict Dependency-Inversion: everything wires through `container.js` (custom IoC), and consumers depend on **interfaces in `contracts/`**, never on concrete impls.

```
routes → controllers → services → repositories | contracts (IBrowserManager, ICookieManager, IIpGeoResolver, IProxyVerifier)
                                       │
                                       └── entities (Profile), constants (DeviceType), errors
```

- **`container.js`** — the *only* place concrete implementations are named. Change what backs an interface here; everywhere else stays untouched.
- **`contracts/`** — abstract base classes throwing `Not implemented`. Every service pluggable into container.
- **`middleware/asyncHandler.js` + `errors.js`** — controllers stay synchronous-looking; `AppError`/`NotFoundError`/`ValidationError`/`ConflictError` bubble to `errorHandler.js` and become HTTP status codes automatically.

### Browser manager routing (IBrowserManager)

`BrowserManagerRouter` is a **stateless facade** implementing `IBrowserManager`. It routes `launch(profile)` by `profile.device_type` to one of:
- `DesktopBrowserManager` — production Puppeteer + stealth impl
- `NotImplementedBrowserManager('mobile_emulated' | 'android_real')` — parameterized stub throwing 501

Router is intentionally stateless — it delegates `isRunning`/`close`/`getActiveProfileIds` by asking sub-managers, avoiding dual state-tracking bugs (e.g. user manually closing a Chromium window).

**When adding a new device type backend** (e.g. real Android via ADB):
1. Add enum value to `constants/DeviceType.js` (one line)
2. Add Zod variant to `validation/schemas.js` discriminated union
3. Implement `AndroidBrowserManager extends IBrowserManager`
4. Swap the `NotImplementedBrowserManager(ANDROID_REAL)` binding in `container.js`
No other files change.

### Profile schema & validation

- **`constants/DeviceType.js`** is the single source of truth for `'desktop' | 'mobile_emulated' | 'android_real'`. Never hardcode these strings elsewhere.
- **`validation/schemas.js`** uses Zod `discriminatedUnion` keyed on `device_type`. A `z.preprocess` shim defaults missing `device_type` to `'desktop'` for backward compat with legacy clients. Only the desktop variant currently has full field validation; mobile/android variants accept base fields only (fingerprint fields will be added when their backends are implemented).
- **SQLite migration** runs on every startup: `SQLiteProfileRepository._applyMigrations()` reads `PRAGMA table_info(profiles)` and issues idempotent `ALTER TABLE ADD COLUMN` for anything in `SCHEMA_COLUMNS` that's missing. To add a persistent field: append to `SCHEMA_COLUMNS`, include in `save()` INSERT, add to `ALLOWED_UPDATE_COLUMNS` if user-editable.

### Fingerprint spoofing pipeline (Desktop)

`DesktopBrowserManager._doLaunch()` applies spoofing in a specific order — reordering breaks stealth:

1. Chromium launched with `--lang`, `--proxy-server`, `--disable-webrtc` (mode-dependent), extensions from `backend/extensions/*` (each with `manifest.json`)
2. First `page` obtained from `browser.pages()` (Puppeteer creates a `about:blank` tab)
3. Proxy `authenticate()` + `setUserAgent()`
4. `_emulateTimezone` — if `profile.timezone === 'auto'`, fetches `ip-api.com/json` **from inside the page context** to get proxy-side timezone
5. `_emulateViewport`, `_emulateGeolocation` (grants geo permission to a hardcoded host list before `setGeolocation`)
6. `Page.addScriptToEvaluateOnNewDocument` with `buildInjectionScript()` from `fingerprint/injector.js` — patches `navigator.platform`, `userAgentData`, WebGL vendor/renderer, canvas/audio noise
7. Force-navigate to `about:blank` if first tab landed on Chromium NTP (`chrome://newtab/`) — NTP fingerprint mismatch is a common captcha trigger

**Launch is race-safe**: `_browsers` (running) and `_launching` (in-flight promises) maps prevent double-spawn when UI double-clicks.

### Cookie manager constraint

`CookieManager` spawns a separate headless Chromium against the same `userDataDir` to read/write cookies via CDP. This **fails with `SingletonLock` error if the profile's regular browser is already running** — Chromium locks the userDataDir. Guard: `_assertNotRunning()` checks `browserManager.isRunning(profile.id)` and throws `ConflictError` (409) with a clear message. `CookieManager` receives `browserManager` via DI (see `container.js`).

### Frontend (ui/src/)

- Vite + React 19 + TS. Tauri wrapper at `ui/src-tauri/` for optional desktop packaging (Rust build).
- `hooks/useProfiles.ts` — state + API glue. Optimistic mutations, so verify server confirmation before assuming success.
- `services/apiService.ts` — thin fetch wrapper against `http://localhost:4000`.
- `types/Profile.ts` — shared shape. `DeviceType` type union mirrors backend constants; keep in sync manually (no codegen).
- Backend online check polls every ~5s — see `App.tsx`.

### `core-poc/`

Standalone Puppeteer PoC script — historical, not integrated with backend/. Safe to ignore unless working on early-stage experimentation.

### Extensions auto-loading

Any folder under `backend/extensions/` containing a `manifest.json` is passed to Chromium via `--load-extension=` and `--disable-extensions-except=`. `buster` (audio captcha solver) is included by default. Extensions load on **every** launch — no per-profile toggle.
