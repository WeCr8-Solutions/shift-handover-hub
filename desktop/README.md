# JobLine AI Desktop

Electron shell that wraps the hosted JobLine AI web application for Windows desktop use.

## Architecture

- **Mode**: Hosted Web Wrap — loads `https://app.jobline.ai` inside an Electron `BrowserWindow`
- **Security**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`
- **Backend**: All backend services remain hosted (no local bundling)
- **Auth**: Email/password works natively; OAuth opens system browser

## Quick Start

```bash
cd desktop
npm install
npm run dev
```

## Build Installer

```bash
npm run build
# Output: release/JobLineAI-Setup-1.0.0.exe
```

## Build Portable

```bash
npm run build:portable
# Output: release/JobLineAI-Portable-1.0.0.exe
```

## Configuration

Config file location: `%APPDATA%/JobLineAI/config.json`

Override with environment variables:
- `JOBLINE_APP_URL` — hosted app URL
- `JOBLINE_LOGS_PATH` — custom log directory

## Project Structure

```
desktop/
├── src/
│   ├── main/
│   │   ├── index.ts        # Electron main process
│   │   ├── config.ts        # Config file management
│   │   └── logger.ts        # File-based logging
│   └── preload/
│       └── index.ts         # Secure contextBridge API
├── assets/
│   └── icons/               # App icons (.png, .ico)
├── docs/                    # Documentation
├── package.json
├── tsconfig.json
└── electron-builder.yml
```

## Documentation

- [Windows Install Guide](docs/Desktop_Windows_Install.md)
- [Build Guide](docs/Desktop_Build_Guide.md)
- [Auth in Electron](docs/Supabase_Auth_in_Electron.md)
- [Release Notes](docs/RELEASE_NOTES_1.0.0.md)
