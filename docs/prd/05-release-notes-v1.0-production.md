# JobLine AI — Production Release Notes & Final Checklist
**Release: v1.0 Production + ITAR v1.2**
**Date: 2026-02-28**
**Branch: main (commits a93b7f9 → 2a53809)**

---

## Release Summary

Three phases shipped and merged to main:

| Phase | Commit | Status |
|-------|--------|--------|
| v1.0 Self-Hosted Config | `a93b7f9` | ✅ Merged |
| v1.1 Security Hardening | `dcf60de` | ✅ Merged |
| v1.2 ITAR Compliance | `2a53809` | ✅ Merged |

---

## Build Artifacts (Verified 2026-02-28)

| Artifact | Size | Status |
|----------|------|--------|
| `desktop/release/JobLineAI-Setup-1.0.0.exe` | ~78 MB NSIS installer | ✅ Built |
| `desktop/release/JobLineAI-Portable-1.0.0.exe` | ~71 MB portable | ✅ Built |
| `dist/` web app | 3.6 MB JS · 112 KB CSS (gzipped) | ✅ Built |

---

## Automated Test Results

```
Test Files  23 passed (23)
Tests       219 passed (219)
TypeScript  0 errors  (tsconfig.app.json)
Electron TS 0 errors  (desktop/tsconfig.json)
Build time  7.24s (web) · 17s (NSIS) · 84s (portable)
```

---

## Production Checklist

### ✅ Code Quality
- [x] 219/219 unit, component, and hook tests passing
- [x] Zero TypeScript errors — web app and Electron desktop
- [x] All 3 feature branches reviewed and squash-merged to main (PRs #1 #2 #4)
- [x] `.gitignore` excludes build artifacts, `node_modules`, and secrets

### ✅ Cloud SaaS (app.jobline.ai)
- [x] Production web build succeeds — `npm run build` → `dist/`
- [x] Analytics (GA4, GTM, AdSense) remain active in default cloud mode
- [x] Google Fonts loaded from CDN — unchanged from baseline
- [x] `VITE_DISABLE_ANALYTICS` flag available for self-hosted suppression
- [ ] **ACTION REQUIRED**: Deploy `dist/` to hosting provider

### ✅ Self-Hosted / ITAR EXE
- [x] `JobLineAI-Setup-1.0.0.exe` — NSIS installer, builds without errors
- [x] `JobLineAI-Portable-1.0.0.exe` — portable, no installation required
- [x] First-launch setup wizard — Cloud vs Self-Hosted choice with URL validation
- [x] Supports env var overrides: `JOBLINE_APP_URL`, `JOBLINE_SUPABASE_URL`, `JOBLINE_SUPABASE_ANON_KEY`
- [x] `config-selfhosted-template.json` provided for IT admins
- [x] ITAR mode flag prevents app connecting to `app.jobline.ai`
- [ ] **PENDING v1.1**: Code-sign EXE (Windows SmartScreen bypass)

### ⚠️ Database Migrations — ACTION REQUIRED

Run these before enabling ITAR controls or distributing to ITAR customers:

```bash
# From the project root, with Supabase service role access:
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**What gets added (additive only — no data loss risk):**

| Migration | Table | Changes |
|-----------|-------|---------|
| `20260228060001` | `organizations` | `mfa_required`, `mfa_required_updated_at/by` |
| `20260228060002` | `organizations` | `requires_us_person_declaration` |
| `20260228060002` | `profiles` | `us_person_declared`, `us_person_declared_at`, `us_person_declaration_text`, `us_person_declaration_ip` |
| `20260228060002` | `activity_type` enum | Adds `us_person_declaration` value |
| `20260228060003` | new table | `data_access_logs` with RLS |

**Without migrations**: ITAR gates silently pass through (all columns default to false/null).

---

## ITAR Compliance Controls — How to Enable

All controls are **off by default**. Org admin/owner enables them at:
`Settings → Organization → ITAR / Export Control Settings`

| Control | DB Column | What it Does |
|---------|-----------|--------------|
| MFA Required | `organizations.mfa_required` | All members must enroll TOTP authenticator before accessing org data |
| US Person Declaration | `organizations.requires_us_person_declaration` | All members must self-certify per 22 C.F.R. §120.15 |
| Data Access Log | Always active post-migration | Admin > Data Access tab shows all READ/WRITE/DELETE/EXPORT events |

---

## ITAR Pilot Customer Distribution Checklist

Before handing the EXE to an ITAR pilot organization:

- [ ] Run `supabase db push` — apply 3 new migrations
- [ ] Org admin enables "MFA Required" in Settings → Organization
- [ ] Org admin enables "US Person Declaration Required" in Settings → Organization
- [ ] Verify Admin → Data Access tab is visible and logs appear after activity
- [ ] Copy `config-selfhosted-template.json`, fill in org's Supabase URL + anon key
- [ ] Place completed config at `%APPDATA%\JobLine AI\config.json` on test machine
- [ ] Run `JobLineAI-Portable-1.0.0.exe` — verify first-launch wizard appears
- [ ] Select Self-Hosted, enter org URL — confirm wizard saves and loads app
- [ ] Login as new user — confirm US Person declaration screen appears
- [ ] Submit declaration — confirm logged in Admin → Activity Logs as "US Person Certified"
- [ ] Login as new user — confirm MFA enrollment screen appears if MFA is required
- [ ] Enroll TOTP — confirm access granted after verification
- [ ] Visit Queue — confirm entry appears in Admin → Data Access audit log

---

## Known Limitations (Planned Next Sprints)

| Item | Priority | Target |
|------|----------|--------|
| Code-sign EXE (Windows SmartScreen) | High | v1.1 |
| Bundle Google Fonts locally (font .woff2 files needed) | Medium | v1.1 |
| Supabase AAL2 MFA session level enforcement | High | v1.2+ |
| Server-side data access logging from Edge Functions | Medium | v1.2+ |
| Automated `supabase db push` in CI/CD pipeline | Medium | v1.1 |
| US Person export authorization path (beyond self-cert) | Medium | v1.2+ |
