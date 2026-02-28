# JobLine AI Desktop — Release Notes v1.0.0

**Release Date**: 2026-02-28

## What's New

### 🖥️ Desktop Application for Windows

JobLine AI is now available as a native Windows desktop application. This release wraps the existing hosted web application in an Electron shell, providing a dedicated desktop experience.

### Features

- **One-click install** — NSIS installer with desktop and Start Menu shortcuts
- **Persistent sessions** — Login once, stay logged in across restarts
- **Dedicated window** — No browser tabs, no distractions
- **Secure by default** — `contextIsolation`, `sandbox`, no `nodeIntegration`
- **Local logging** — Application logs saved to `%APPDATA%\JobLine AI\logs\`
- **Configurable** — JSON config file for URL and path overrides
- **External links** — Open in system browser, not in-app

### Authentication

- ✅ Email/password login works natively
- ⚠️ OAuth (Google/Microsoft) opens in system browser (v1 limitation)

### What's NOT Included (v1)

- Auto-update mechanism (manual installer distribution only)
- Offline/airgap mode
- Local backend bundling
- Code signing certificate (SmartScreen warning expected)

## System Requirements

- Windows 10 (64-bit) or later
- Internet connection (app loads from cloud)
- ~200 MB disk space

## Known Issues

| Issue | Workaround |
|-------|------------|
| Windows SmartScreen warning on install | Click "More info" → "Run anyway" |
| OAuth may require manual refresh | After OAuth in browser, click the app window |
| ~150 MB installer size | Expected for Electron apps |

## Upgrade Path

Future releases will include:
- Auto-update via electron-updater
- Code signing to eliminate SmartScreen warnings
- Optional embedded mode for offline/ITAR environments
- Custom protocol handler for seamless OAuth
