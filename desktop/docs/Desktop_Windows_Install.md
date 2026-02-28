# JobLine AI — Windows Desktop Install Guide

## System Requirements

- **OS**: Windows 10 (64-bit) or later
- **RAM**: 4 GB minimum
- **Disk**: ~200 MB for installation
- **Network**: Internet connection required (app loads from cloud)

## Installation

1. Download the latest `JobLineAI-Setup-x.y.z.exe` from your provided distribution link.
2. Double-click the installer.
3. If Windows SmartScreen appears, click **"More info"** → **"Run anyway"**.
   - This warning appears because the app is not yet code-signed. A future release will include a certificate.
4. Choose an installation directory (default is fine).
5. Click **Install**.
6. The app will be added to:
   - Desktop shortcut
   - Start Menu → JobLine AI

## First Launch

1. Open **JobLine AI** from your desktop or Start Menu.
2. The app will load the hosted JobLine AI web application.
3. Log in with your email and password.
4. Your session will persist between restarts.

## Configuration

A configuration file is stored at:

```
%APPDATA%\JobLine AI\config.json
```

You can open this folder from within the app (if the feature is exposed) or navigate manually.

## Logs

Application logs are written to:

```
%APPDATA%\JobLine AI\logs\
```

Log files are named by date: `jobline-2026-02-28.log`

## Uninstalling

1. Open **Settings** → **Apps** → **Apps & features**
2. Search for **JobLine AI**
3. Click **Uninstall**

Or use the uninstaller in the Start Menu → JobLine AI folder.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App shows blank/white screen | Check internet connection; the app requires cloud access |
| Login not working | Ensure you're using email/password (OAuth opens in system browser) |
| SmartScreen blocks installer | Click "More info" → "Run anyway" |
| App won't start | Check logs at `%APPDATA%\JobLine AI\logs\` |
