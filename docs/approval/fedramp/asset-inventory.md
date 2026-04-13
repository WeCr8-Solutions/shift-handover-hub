# Integrated Asset Inventory — SSP Appendix M
**System:** JobLine AI  
**Organization:** WeCr8 Solutions  
**Version:** 1.0  
**Date:** April 13, 2026  
**NIST Control:** CM-8, SA-4  
**Owner:** Engineering Lead  
**Review Cycle:** Updated on each production release  

> This inventory satisfies FedRAMP SSP Appendix M (Integrated Inventory Workbook). All virtual/software components within or connected to the JobLine AI authorization boundary are listed. There is no physical hardware — all compute is cloud-hosted (SaaS model).

---

## 1. System Components — Platform Services

| Component ID | Component Name | Type | Vendor | Version / Tier | Role | Location | FedRAMP Status | Notes |
|-------------|---------------|------|--------|---------------|------|----------|---------------|-------|
| SVC-001 | Supabase PostgreSQL | Managed Database | Supabase Inc. | PostgreSQL 15 | Primary data store — all org/user/operational data | AWS us-east-1 | ❌ NOT authorized | G-00 blocker — migration required |
| SVC-002 | Supabase Auth | Authentication Service | Supabase Inc. | Auth2 (GoTrue) | JWT-based auth, TOTP MFA, OAuth2 | AWS us-east-1 | ❌ NOT authorized | G-00 blocker |
| SVC-003 | Supabase Edge Functions | Serverless Compute | Supabase Inc. | Deno runtime | Backend business logic, webhooks | AWS us-east-1 | ❌ NOT authorized | G-00 blocker |
| SVC-004 | Supabase Realtime | WebSocket Service | Supabase Inc. | Realtime v2 | Live data sync for shift handoffs | AWS us-east-1 | ❌ NOT authorized | G-00 blocker |
| SVC-005 | Supabase Storage | Object Storage | Supabase Inc. | Storage v1 (S3-backed) | File attachments, exports | AWS us-east-1 | ❌ NOT authorized | G-00 blocker |
| SVC-006 | Vercel | Frontend CDN / Hosting | Vercel Inc. | Enterprise | React SPA hosting, edge routing | US edge (multiple) | ❌ NOT authorized | G-00 blocker |
| SVC-007 | Stripe | Payment Processing | Stripe Inc. | API v2024 | Subscription billing, seat management | US (Stripe infra) | ❌ NOT authorized | Out of boundary — payment only; no federal data |
| SVC-008 | External LLM API | AI Inference | [Vendor TBD] | API | AI planning assistant feature | Vendor cloud | ❌ NOT authorized | G-12: opt-out toggle needed; G-13: prompt injection controls needed |
| SVC-009 | Google Analytics GA4 | Analytics | Google LLC | GA4 | Usage telemetry (disabled in self-hosted) | Google US | ❌ NOT authorized | Disabled via `VITE_DISABLE_ANALYTICS=true` in self-hosted/ITAR deployment |
| SVC-010 | GitHub | Source Control / CI | GitHub Inc. (Microsoft) | Enterprise Cloud | Code repository, GitHub Actions CI/CD | Microsoft US | ✅ FedRAMP Moderate | GitHub is on FedRAMP Marketplace; Actions runners are ephemeral |

---

## 2. System Components — Application Software

### 2a. Web Application (SaaS Frontend)

| Component ID | Component | Version (declared) | Type | Purpose | Security Relevance |
|-------------|-----------|-------------------|------|---------|-------------------|
| APP-001 | React | ^18.3.1 | Production | UI framework | Client-side rendering |
| APP-002 | React Router DOM | ^6.30.1 | Production | Client-side routing | Route-level auth guards |
| APP-003 | @supabase/supabase-js | ^2.91.1 | Production | Supabase API client | Auth, DB, storage, realtime |
| APP-004 | @tanstack/react-query | ^5.83.0 | Production | Server state management | Caching, data fetching |
| APP-005 | Zod | ^3.25.76 | Production | Schema validation | Input validation — OWASP |
| APP-006 | React Hook Form | ^7.61.1 | Production | Form handling | Input validation |
| APP-007 | Zustand | ^5.0.11 | Production | Client state management | Org/user state |
| APP-008 | React Markdown | ^10.1.0 | Production | Markdown rendering | Handoff note rendering |
| APP-009 | @radix-ui/* (22 packages) | ^1.x–^2.x | Production | UI component primitives | Accessible UI |
| APP-010 | ExcelJS | ^4.4.0 | Production | Excel file generation | Work order / report exports |
| APP-011 | Recharts | ^2.15.4 | Production | Data visualization | Analytics dashboards |
| APP-012 | Date-fns | ^3.6.0 | Production | Date manipulation | Shift scheduling |
| APP-013 | React Joyride | ^2.9.3 | Production | Onboarding tours | Guided UI tours |
| APP-014 | QRCode React | ^4.2.0 | Production | QR code generation | MFA enrollment QR display |
| APP-015 | Input OTP | ^1.4.2 | Production | OTP input UI | MFA enrollment |
| APP-016 | Next Themes | ^0.3.0 | Production | Dark/light mode | UI theming |
| APP-017 | Sonner | ^1.7.4 | Production | Toast notifications | User feedback UI |
| APP-018 | Lucide React | ^0.462.0 | Production | Icon library | UI icons |
| APP-019 | Clsx | ^2.1.1 | Production | CSS class utility | Styling |
| APP-020 | Tailwind Merge | ^2.6.0 | Production | Tailwind CSS utility | Styling |
| APP-021 | Class Variance Authority | ^0.7.1 | Production | Component variants | UI component system |
| APP-022 | Tailwind CSS Animate | ^1.0.7 | Production | CSS animations | UI animations |
| APP-023 | Vaul | ^0.9.9 | Production | Drawer component | Mobile UI |
| APP-024 | Embla Carousel React | ^8.6.0 | Production | Carousel component | UI |
| APP-025 | React Helmet Async | ^2.0.5 | Production | HTML head management | SEO, meta tags |
| APP-026 | React Resizable Panels | ^2.1.9 | Production | Resizable layout | UI layout |
| APP-027 | React Day Picker | ^8.10.1 | Production | Date picker | Scheduling UI |
| APP-028 | Cmdk | ^1.1.1 | Production | Command palette | Keyboard navigation UI |
| APP-029 | @lovable.dev/cloud-auth-js | ^1.0.0 | Production | Cloud auth helper | Auth integration |
| APP-030 | @mdx-js/rollup | ^3.1.1 | Production | MDX bundling | Documentation rendering |
| APP-031 | Remark Frontmatter | ^5.0.0 | Production | MDX processing | Markdown metadata |
| APP-032 | Remark MDX Frontmatter | ^5.2.0 | Production | MDX processing | Markdown metadata |
| APP-033 | @testing-library/dom | ^10.4.1 | Production | DOM test utilities | Testing |
| APP-034 | @testing-library/user-event | ^14.6.1 | Production | User interaction testing | Testing |

### 2b. Build / Development Tooling (not in authorization boundary)

| Component ID | Component | Version | Type | Purpose |
|-------------|-----------|---------|------|---------|
| DEV-001 | Vite | ^5.4.19 | Dev | Build tool, dev server |
| DEV-002 | TypeScript | ^5.8.3 | Dev | Type checking |
| DEV-003 | Vitest | ^3.2.4 | Dev | Unit testing framework |
| DEV-004 | ESLint | ^9.32.0 | Dev | Linting + security rules |
| DEV-005 | TypeScript ESLint | ^8.38.0 | Dev | TypeScript linting |
| DEV-006 | @vitejs/plugin-react-swc | ^3.11.0 | Dev | React + SWC build plugin |
| DEV-007 | Tailwind CSS | ^3.4.17 | Dev | CSS framework |
| DEV-008 | Autoprefixer | ^8.5.6 | Dev | CSS autoprefixing |
| DEV-009 | PostCSS | ^8.5.6 | Dev | CSS transformation |
| DEV-010 | Lovable Tagger | ^1.1.13 | Dev | Component tagging |
| DEV-011 | Globals | ^15.15.0 | Dev | JS global definitions |
| DEV-012 | JSDom | ^20.0.3 | Dev | DOM simulation for tests |

---

## 3. System Components — Edge Functions (Supabase / Deno)

All 16 Edge Functions run in Supabase's Deno runtime on AWS us-east-1. All require valid Supabase JWT (AC-3, IA-3).

| Component ID | Function Name | Purpose | External Calls | Auth Required |
|-------------|--------------|---------|---------------|---------------|
| FN-001 | activate-station-context | Activates a workstation's station context for a user | Supabase DB | ✅ JWT |
| FN-002 | ai-planning-assistant | AI-powered shift planning via external LLM API | LLM API (external, SVC-008) | ✅ JWT |
| FN-003 | auth-email-hook | Custom Supabase Auth email delivery hook | Email service | ✅ JWT |
| FN-004 | check-subscription | Validates org subscription status | Stripe API (SVC-007) | ✅ JWT |
| FN-005 | create-checkout | Creates Stripe checkout session | Stripe API (SVC-007) | ✅ JWT |
| FN-006 | create-donation | Creates Stripe donation session | Stripe API (SVC-007) | ✅ JWT |
| FN-007 | customer-portal | Stripe customer portal redirect | Stripe API (SVC-007) | ✅ JWT |
| FN-008 | erp-sync | External ERP system synchronization | ERP endpoint (org-configured) | ✅ JWT |
| FN-009 | process-notifications | Sends notification emails/push for events | Email service | ✅ JWT + service role |
| FN-010 | report-issue | Submits issue reports | Supabase DB | ✅ JWT |
| FN-011 | rls-health | Row Level Security health check | Supabase DB | ✅ Service role |
| FN-012 | send-email | Transactional email sending | Email service | ✅ JWT + service role |
| FN-013 | social-agent | Social media integration agent | External social APIs | ✅ JWT |
| FN-014 | stripe-webhook | Handles Stripe payment events | Supabase DB | Stripe webhook signature |
| FN-015 | update-seats | Updates org seat counts | Supabase DB + Stripe | ✅ JWT + service role |
| FN-016 | verify-station-context-payment | Verifies station activation payment | Stripe + Supabase DB | ✅ JWT |

---

## 4. System Components — Desktop Application

| Component ID | Component | Version | Type | Purpose | Deployment Model |
|-------------|-----------|---------|------|---------|-----------------|
| DSK-001 | Electron | ^33.2.0 | Runtime | Desktop app shell | ITAR self-hosted deployment |
| DSK-002 | Electron Builder | ^25.1.8 | Build tool | Package/sign Electron app | Build only |
| DSK-003 | TypeScript | ^5.8.3 | Dev | Type checking | Build only |

**Desktop app connects to:** Customer-hosted Supabase instance (self-hosted path) OR Supabase commercial (ITAR-lite path). The Electron shell bundles the same React SPA served from the web.

---

## 5. External Service Connections (Outside Authorization Boundary)

| Connection ID | Service | Direction | Protocol | Port | Data Shared | Risk |
|-------------|---------|-----------|----------|------|------------|------|
| EXT-001 | Supabase API | Outbound | HTTPS / WSS | 443 | All application data | Primary (SVC-001–005) |
| EXT-002 | Vercel CDN | Inbound | HTTPS | 443 | Static assets | Frontend serving (SVC-006) |
| EXT-003 | Stripe API | Outbound | HTTPS | 443 | Billing data only (no PII beyond email) | Low — payment only |
| EXT-004 | LLM API | Outbound | HTTPS | 443 | Shift planning context (may include org data) | Medium — G-12, G-13 required |
| EXT-005 | Google Analytics | Outbound | HTTPS | 443 | Anonymized usage events | Low — disabled in self-hosted |
| EXT-006 | Email service | Outbound | HTTPS/SMTP | 443/587 | User email addresses, notification content | Low |
| EXT-007 | GitHub | Bidirectional | HTTPS/SSH | 443/22 | Source code only | Low — FedRAMP authorized |

---

## 6. Ports and Protocols Summary

| Protocol | Port | Direction | Purpose |
|----------|------|-----------|---------|
| HTTPS (TLS 1.2+) | 443 | Inbound/Outbound | All web traffic, API calls |
| WSS (WebSocket Secure) | 443 | Outbound | Supabase Realtime |
| PostgreSQL (TLS) | 5432 | Outbound | Direct DB connections (migration tooling only) |
| SSH | 22 | Outbound | GitHub (CI/CD, git operations) |

---

## 7. Inventory Maintenance

This inventory is maintained as follows:

| Trigger | Action |
|---------|--------|
| New npm dependency added | Add to Section 2a; update `package.json`; run Trivy scan |
| New Edge Function deployed | Add row to Section 3 |
| New external service integrated | Add to Section 5; assess boundary impact; update SSP Section 7 |
| New desktop release | Update DSK-001 version |
| Infrastructure migration (G-00) | Sections 1 and 5 will be fully rewritten for new FedRAMP-authorized components |
| Monthly | Review for accuracy; commit with `docs(fedramp): inventory update [YYYY-MM]` |

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release. 62 production npm deps, 21 dev deps, 16 Edge Functions, 1 desktop app. All platform services on non-FedRAMP infrastructure (G-00 blocker). |
