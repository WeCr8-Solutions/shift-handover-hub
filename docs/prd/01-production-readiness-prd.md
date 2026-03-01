# JobLine AI — Production Readiness PRD

**Version:** 1.0.0
**Date:** 2026-02-28
**Status:** Production Ready (v1)
**Audience:** Engineering, QA, Product, Leadership

---

## 1. Product Overview

JobLine AI is a manufacturing shift-handover and work-order management platform designed for shop-floor operations in aerospace, defense, and precision manufacturing environments. It enables operators, supervisors, and administrators to manage shift handoffs, track work orders, monitor station performance, and coordinate team activities in real time.

### 1.1 Delivery Channels

| Channel | Description | Artifact |
|---------|-------------|---------|
| **Web App** | Hosted SaaS at `https://app.jobline.ai` | Vite/React PWA on Supabase |
| **Desktop (Windows)** | Electron wrapper for Windows 10/11 x64 | `JobLineAI-Setup-1.0.0.exe` (NSIS) |
| **Desktop (Portable)** | No-install portable EXE | `JobLineAI-Portable-1.0.0.exe` |

---

## 2. Architecture

### 2.1 Web Application Stack

```
Frontend          Backend           Infrastructure
─────────         ───────           ──────────────
React 18          Supabase          Supabase Cloud
Vite 5            PostgreSQL        (Commercial SaaS)
TailwindCSS       Row-Level         
Radix UI          Security (RLS)    
TanStack Query    Edge Functions    
React Router 6    (Deno)
```

### 2.2 Desktop Architecture

The desktop client is a **hosted-web-wrap** — an Electron `BrowserWindow` that loads the web app URL. There is no local web server or bundled frontend code. All business logic remains in the hosted web application.

```
JobLine AI.exe (Electron 33 / Chromium)
├── main/index.ts         — App lifecycle, window management, IPC handlers
├── main/config.ts        — Config file + env-var loading (%APPDATA%/JobLine AI/)
├── main/logger.ts        — File-based logging (daily log rotation)
└── preload/index.ts      — Secure context bridge (window.jobline)
```

**Security defaults:**
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- Popups blocked; external links open in system browser
- Navigation confined to app host domain

### 2.3 User Role Hierarchy

```
Platform Level        Org Level        Team Level
──────────────        ─────────        ──────────
admin                 owner            owner
developer             admin            admin
supervisor            member           member
operator
viewer
```

---

## 3. Feature Scope (v1.0.0)

### 3.1 Core Features

| Feature | Status | Notes |
|---------|--------|-------|
| Shift Handoff Creation | Production | Full form with CNC type detection, TriState toggles, draft persistence |
| Work Order Queue | Production | Kanban + list + calendar views, filters, stats |
| Station Management | Production | Per-station status, machine profiles, check-in/check-out |
| Team Management | Production | Multi-team org structure, invite codes, member roles |
| Operator Dashboard | Production | Station panel, active work orders, session tracking |
| Supervisor Dashboard | Production | Org-wide KPIs, attention items, production analytics |
| NCR (Non-Conformance Reports) | Production | Create, approve, quantity tracking, quality metrics |
| Bulk Upload | Production | Excel template import for work orders |
| ERP Connector | Production | JobBoss Cloud integration (bidirectional sync) |
| Settings | Production | 8 settings panels (General, Shift, Manufacturing, Billing, etc.) |
| Routing Templates | Production | Work order routing editor, outside processing manager |
| Admin Panel | Production | User management, org oversight, RLS health check, issue queue |
| Onboarding | Production | Guided tour, org setup wizard, progress tracking |
| Subscription & Billing | Production | Stripe integration, trial management, entitlement gates |

### 3.2 Desktop-Specific Features

| Feature | Status | Notes |
|---------|--------|-------|
| NSIS Installer (x64) | Production | `JobLineAI-Setup-1.0.0.exe` |
| Portable EXE | Production | `JobLineAI-Portable-1.0.0.exe` |
| Persistent Window | Production | Session survives app restart via localStorage |
| Single Instance Lock | Production | Second launch focuses existing window |
| File Logging | Production | `%APPDATA%/JobLine AI/logs/jobline-YYYY-MM-DD.log` |
| Config File | Production | `%APPDATA%/JobLine AI/config.json` |
| Self-Hosted Config | Production | All fields overridable via env vars or config.json |
| External Link Handling | Production | Opens in system browser; allowlist enforced |

---

## 4. Known Gaps & Limitations (v1.0.0)

### 4.1 Desktop

| Gap | Severity | Target Version |
|-----|----------|---------------|
| No code signing (SmartScreen warning on first run) | Medium | v1.1 |
| No auto-update mechanism | Medium | v1.2 |
| `electron-log` listed as dependency but unused | Low | v1.1 |
| OAuth (Google/GitHub) requires manual session refresh after browser redirect | Low | v1.1 |
| No macOS or Linux builds | Low | v2.0 |

### 4.2 Platform Security

| Gap | Severity | Target Version |
|-----|----------|---------------|
| No MFA enforcement | High | v1.2 |
| No US-person (ITAR) access gating at signup | High | v2.0 |
| Airgap / offline mode not implemented | High | v2.0 |
| Analytics (GA4) tracks user ID on signup | Medium | v1.1 |
| Several Edge Functions use `verify_jwt = false` | Medium | v1.1 |
| No IP allowlisting or geo-restriction | Medium | v2.0 |

### 4.3 Coverage & CI

| Gap | Severity | Target Version |
|-----|----------|---------------|
| No test coverage reporting | Low | v1.1 |
| No CI/CD pipeline (GitHub Actions) | Medium | v1.1 |
| Deno edge function tests require live environment | Low | Ongoing |

---

## 5. Infrastructure Requirements (Production)

### 5.1 Cloud Deployment (Current)

| Component | Requirement |
|-----------|-------------|
| Supabase Project | Pro tier or higher (for RLS, Edge Functions, realtime) |
| Edge Functions | Deno Deploy (managed by Supabase) |
| Stripe | Standard account with webhook endpoint configured |
| Domain | `app.jobline.ai` with valid TLS certificate |
| File Storage | Supabase Storage for Excel uploads and assets |

### 5.2 Database Requirements

- PostgreSQL 15+ (Supabase managed)
- All migrations applied (see `supabase/migrations/`)
- RLS enabled on all user-facing tables
- RLS health check function deployed and passing

### 5.3 Environment Variables (Web App)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

---

## 6. Security Posture

### 6.1 Data Isolation
- Every database table uses Row-Level Security (RLS) with `organization_id` scoping
- Users cannot access data outside their organization
- Automated RLS health check validates isolation on every deployment

### 6.2 Authentication
- Email/password via Supabase Auth (JWT-based sessions)
- Activity logs written to `activity_logs` table (login/logout/signup with IP)
- Sensitive localStorage data cleared on logout

### 6.3 Desktop Security
- Renderer process sandboxed (`sandbox: true`)
- No Node.js APIs exposed to web content
- Context bridge exposes only 3 whitelisted IPC calls
- Navigation restricted to app host domain

---

## 7. Release Artifacts (v1.0.0)

| Artifact | Size | SHA / Location |
|----------|------|---------------|
| `JobLineAI-Setup-1.0.0.exe` | ~82 MB | `desktop/release/` |
| `JobLineAI-Portable-1.0.0.exe` | ~74 MB | `desktop/release/` |
| `JobLineAI-Setup-1.0.0.exe.blockmap` | ~86 KB | `desktop/release/` |
| `builder-debug.yml` | 6 KB | `desktop/release/` |

---

## 8. Sign-Off Criteria

Before marking v1.0.0 production-ready, the following must be confirmed:

- [ ] All 23 Vitest test files pass (219 tests)
- [ ] Both EXE artifacts build without errors
- [ ] NSIS installer installs and launches on a clean Windows 10/11 machine
- [ ] App loads `https://app.jobline.ai` correctly in the Electron window
- [ ] Login with email/password succeeds and session persists on restart
- [ ] Logs appear in `%APPDATA%/JobLine AI/logs/`
- [ ] Config file created at `%APPDATA%/JobLine AI/config.json`
- [ ] SmartScreen warning appears (expected — no code signing in v1)
- [ ] Uninstaller removes the application cleanly
