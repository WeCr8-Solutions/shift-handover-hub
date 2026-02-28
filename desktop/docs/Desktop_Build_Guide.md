# JobLine AI — Desktop Build Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+
- **Windows 10/11** (for building the Windows installer)

## Setup

```bash
cd desktop
npm install
```

## Development

Run the app in development mode (loads hosted URL):

```bash
npm run dev
```

This compiles TypeScript and launches Electron.

## Building the Installer

```bash
npm run build
```

Output: `desktop/release/JobLineAI-Setup-1.0.0.exe`

### Portable Build

```bash
npm run build:portable
```

Output: `desktop/release/JobLineAI-Portable-1.0.0.exe`

## Project Structure

```
desktop/
├── src/
│   ├── main/
│   │   ├── index.ts      # Electron main process entry
│   │   ├── config.ts      # Config file read/write
│   │   └── logger.ts      # File-based logger
│   └── preload/
│       └── index.ts       # contextBridge API
├── dist/                  # Compiled JS (gitignored)
├── release/               # Built installers (gitignored)
├── assets/
│   └── icons/             # App icons
├── docs/                  # Documentation
├── package.json
├── tsconfig.json
└── electron-builder.yml
```

## Configuration Overrides

Environment variables override `config.json`:

| Variable | Description |
|----------|-------------|
| `JOBLINE_APP_URL` | Hosted app URL |
| `JOBLINE_API_BASE_URL` | API base URL |
| `JOBLINE_LOGS_PATH` | Custom logs directory |
| `JOBLINE_MODE` | `cloud` (default) or `embedded` |

## Icons

Place your icon files in `desktop/assets/icons/`:
- `icon.png` — 256×256+ PNG (used by electron-builder for all platforms)
- electron-builder will auto-generate `.ico` from the PNG

## Versioning

Update the version in `desktop/package.json` before building:

```json
"version": "1.0.1"
```

The version is embedded in the installer filename and app metadata.

## Security Checklist

Before each release, verify:

- [ ] `nodeIntegration: false`
- [ ] `contextIsolation: true`
- [ ] `sandbox: true`
- [ ] No `fs` or `child_process` in preload
- [ ] External links open in system browser
- [ ] Popups are blocked except for allowlisted domains
