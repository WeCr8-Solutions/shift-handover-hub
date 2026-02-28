

## Electron Desktop Wrapper: Implementation Checklist & Plan

### Pre-Implementation Category Checklist

Before writing code, here is a structured audit of what exists and what needs to be built, organized by category.

```text
Category                        Status    Notes
─────────────────────────────────────────────────────────────────
1. Project Structure            ❌ New    /desktop folder does not exist
2. Electron Main Process        ❌ New    BrowserWindow + security defaults
3. Preload Bridge               ❌ New    Minimal safe API (version, links, paths)
4. Config System                ❌ New    %APPDATA%/JobLineAI/config.json
5. Packaging (electron-builder) ❌ New    NSIS installer, icons, shortcuts
6. Auth Compatibility           ✅ Ready  Email/password via Supabase works in BrowserWindow
                                ⚠️ Note   OAuth (if added) needs system browser fallback
7. CORS / Origins               ✅ Ready  Loading hosted URL = same origin, no CORS changes
8. Session Persistence          ✅ Ready  Supabase uses localStorage, works in Electron
9. Backend / Edge Functions      ✅ Ready  All remain hosted, no changes needed
10. Documentation               ❌ New    Install guide, build guide, auth notes, release notes
11. Existing Web App             ✅ Ready  No changes to React app required for v1
```

### Key Design Decisions (Already Made Per Notion Doc)

1. **Mode**: Hosted Web Wrap (`appUrl: https://app.jobline.ai`) -- no local bundling for v1
2. **Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
3. **OAuth**: v1 uses system browser; email/password works natively
4. **Backend**: Stays hosted -- no backend packaging
5. **Updates**: Manual installer distribution for v1 (no auto-updater yet)

### Implementation Steps

**Step 1: Create `/desktop` folder structure**
- `/desktop/package.json` -- Electron + electron-builder deps
- `/desktop/electron-builder.yml` -- NSIS config, appId, icons, shortcuts
- `/desktop/tsconfig.json` -- TypeScript config for Electron main/preload
- `/desktop/README.md` -- Quick start for developers

**Step 2: Electron main process** (`/desktop/src/main/index.ts`)
- Create `BrowserWindow` with security defaults
- Load `appUrl` from config with fallback to env
- Block unwanted popups; allowlist Supabase auth + docs domains
- Handle deep links and window lifecycle (single instance lock)
- Write logs to configured `logsPath`

**Step 3: Preload bridge** (`/desktop/src/preload/index.ts`)
- Expose via `contextBridge`:
  - `window.jobline.getVersion()` -- app version
  - `window.jobline.openExternal(url)` -- open in system browser
  - `window.jobline.openPath(type)` -- open logs/config folder
- No `fs` or `child_process` exposure to renderer

**Step 4: Config system** (`/desktop/src/main/config.ts`)
- Read/write `config.json` from `%APPDATA%/JobLineAI/`
- Schema: `mode`, `appUrl`, `apiBaseUrl`, `supabaseUrl`, `supabaseAnonKey`, `updateChannel`, `logsPath`
- Environment variable overrides take priority over config file

**Step 5: Packaging configuration** (`/desktop/electron-builder.yml`)
- Target: NSIS installer (`JobLineAI-Setup-x.y.z.exe`)
- Optional: portable `.exe`
- App ID: `com.joblineai.desktop`
- Shortcuts: Desktop + Start Menu
- Uninstall entry in Windows Programs
- Log/config paths in AppData (not install dir)

**Step 6: Icons & assets** (`/desktop/assets/icons/`)
- Convert existing `jobline-logo.png` to `.ico` format (256x256 multi-res)
- Include `icon.png` for Linux/macOS future use

**Step 7: Documentation**
- `/desktop/docs/Desktop_Windows_Install.md` -- End-user install guide
- `/desktop/docs/Desktop_Build_Guide.md` -- Developer build instructions
- `/desktop/docs/Supabase_Auth_in_Electron.md` -- Auth flow notes, OAuth troubleshooting
- `/desktop/docs/RELEASE_NOTES_1.0.0.md` -- Initial release notes

### What Does NOT Change (v1)

- No modifications to the React web app (`/src`)
- No changes to edge functions or database
- No changes to Supabase config or RLS policies
- No local backend bundling
- No auto-update mechanism (manual installer only)

### Acceptance Criteria

1. `cd desktop && npm run build` produces `JobLineAI-Setup-1.0.0.exe`
2. Installer runs on clean Windows machine
3. App opens hosted web app inside Electron window
4. Email/password login works (Supabase session persists)
5. Logs written to `%APPDATA%/JobLineAI/logs/`
6. `nodeIntegration: false`, `contextIsolation: true` verified
7. External links open in system browser, not in-app

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Supabase OAuth redirect fails in Electron | v1: email/password only; OAuth via system browser later |
| CORS issues with file:// protocol | v1 loads hosted URL, no file:// |
| Large installer size (~150MB) | Expected for Electron; acceptable for desktop app |
| Windows Defender SmartScreen warning | Code signing needed later; document for users |

