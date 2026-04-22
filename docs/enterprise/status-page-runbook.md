# Status Page Setup Runbook

**Service:** JobLine AI  
**FedRAMP Controls:** CP-2 (Contingency Plan), SA-17 (Developer Testing and Evaluation)  
**Gap Reference:** G-16  
**Last Updated:** April 2026

---

## Overview

JobLine AI must maintain a public status page at `status.jobline.ai` to:

- Provide transparency on service availability and incidents to customers (including federal agencies)
- Satisfy CP-2 requirements for incident notification procedures
- Demonstrate SA-17 operational visibility practices in the FedRAMP ConMon cycle
- Allow agency IT staff to monitor JobLine availability without contacting support

---

## Target Architecture

```
status.jobline.ai (CNAME → status service provider CDN)
     │
     ├── Monitor: https://jobline.ai                  (homepage ping)
     ├── Monitor: https://jobline.ai/api/health        (API health endpoint)
     ├── Monitor: Supabase edge functions endpoint      (auth + data)
     └── Monitor: https://jobline.ai/dashboard          (authenticated SPA)

Check interval: 1 minute
Locations: US East, US West, Europe (for geographic coverage)
```

---

## Recommended Provider: Instatus

Instatus is the recommended provider for its simplicity and custom domain support.

**Alternative:** Better Uptime, UptimeRobot Status Pages, Atlassian Statuspage, or Freshstatus.

---

## Instatus Tier Comparison

JobLine AI's status page setup is designed to be **operational on the Free (Starter) tier** and **upgraded to Pro when custom domain + faster checks are required for FedRAMP / enterprise sales**.

| Capability | **Starter (Free)** — current | **Pro (Paid)** — required for FedRAMP |
|---|---|---|
| Monitors | 15 | 50 |
| Check frequency | 2 minutes | 30 seconds |
| Alert channels | Email only | Email + SMS |
| Team members | 5 | 50 |
| On-call members | 2 | 20 |
| Status page type | Public only | Public |
| **Custom domain (`status.jobline.ai`)** | ❌ Not supported | ✅ 1 included |
| Subscribers | 200 | 5,000 |
| Public URL | `status-joblineai.instatus.com` | `status.jobline.ai` |
| FedRAMP-suitable? | ⚠️ Partial — works for ConMon evidence, but lacks branded URL agencies expect | ✅ Yes (custom domain + SLA-aligned 30-sec checks) |

**Current state (April 2026):** Operating on **Starter (Free)**. Public URL is `https://status-joblineai.instatus.com`. The `status.jobline.ai` Cloudflare CNAME is provisioned and ready, but **will not resolve until upgrade to Pro**.

**Trigger to upgrade to Pro:** First federal customer prospect requests status-page URL on `jobline.ai` domain, OR when ConMon package requires the branded URL as evidence.

---

## Setup Steps (Instatus)

### 1. Create Account and Site

1. Sign up at [instatus.com](https://instatus.com).
2. Create a new page named `JobLine.ai Monitor`.
3. **Free tier:** Subdomain auto-assigned as `status-joblineai` → page lives at `https://status-joblineai.instatus.com`.
4. **Pro tier:** After upgrade, bind `status.jobline.ai` (see Step 4).

### 2. Add Monitors

**Free tier limit:** 15 monitors max, 2-minute check interval.
**Pro tier:** 50 monitors max, 30-second check interval.

JobLine's monitor set fits comfortably under the Free 15-monitor cap (currently uses ~10):

| Name | URL | Type | Alert on |
|------|-----|------|----------|
| Marketing Site | `https://jobline.ai` | Website | Status ≠ 200 |
| Web App | `https://app.jobline.ai` | Website | Status ≠ 200 |
| Developer Portal | `https://dev.jobline.ai/dev` | Website | Status ≠ 200 |
| Help Center | `https://docs.jobline.ai/help` | Website | Status ≠ 200 |
| Supabase REST API | `https://kgrstnbxqdmadtoankqr.supabase.co/rest/v1/` (header `apikey: <anon>`) | API | Status ≠ 200 |
| Supabase Auth | `https://kgrstnbxqdmadtoankqr.supabase.co/auth/v1/health` | API | Status ≠ 200 |
| Edge: AI Planning | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/ai-planning-assistant` | API | Status = 5xx (401 expected) |
| Edge: Stripe Webhook | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/stripe-webhook` | API | Status = 5xx (400 expected) |
| Email Heartbeat | (cron URL pinged by `send-email` health) | Cron/Heartbeat | No ping in 24h |
| DNS A-record | `jobline.ai` | DNS | A record drift from `185.158.133.1` |

### 3. Add Components

Add components matching the monitored services:

- **Web Application** — `jobline.ai` SPA and CDN (Vercel)
- **API & Database** — Supabase PostgreSQL and Auth
- **AI Planning Assistant** — Edge function (ai-planning-assistant)
- **SIEM Log Export** — Edge function (log-export)
- **Electron Desktop App** — Distribution and update server

### 4. Configure Custom Domain (⚠️ Pro tier only)

**Custom domains are NOT available on the Free Starter tier.** This step requires upgrading to **Pro** ($/month, 1 custom domain included).

Once upgraded:

1. In Instatus, go to **Settings → Page settings → Custom Domain** and enter `status.jobline.ai`.
2. In Cloudflare DNS, confirm the CNAME (already provisioned):
   ```
   Type: CNAME
   Name: status
   Target: status.instatus.com
   Proxy: DNS only (gray cloud) — Instatus requires direct CNAME
   ```
3. Wait for DNS verification + Let's Encrypt cert issuance (typically 5–30 minutes).
4. Verify:
   ```bash
   curl -sI https://status.jobline.ai/ | head -3
   # Expect: HTTP/2 200, server: instatus / vercel
   ```

**Until upgraded:** Customers and FedRAMP evidence must reference `https://status-joblineai.instatus.com`.

### 5. Configure Incident Notifications

In Instatus settings:
- **Email subscribers (Free):** Up to 200 subscribers can opt-in to incident emails. ✅ Available now.
- **SMS / Phone alerts (Pro+):** Required for on-call paging. ❌ Not on Free.
- **Slack webhook:** Available on all tiers — point to `#incidents` or `#ops`.
- **Webhook:** Configure to POST incident events to the `report-issue` edge function or PagerDuty/OpsGenie.

### 6. SLA Targets to Publish

Publish the following SLA targets on the status page (matches ISCP):

| Service | Uptime Target | RTO | RPO |
|---------|--------------|-----|-----|
| Web App | 99.9% monthly | 4 hours | 1 hour |
| API | 99.9% monthly | 4 hours | 1 hour |
| Self-Hosted | 99.5% monthly | 24 hours | 24 hours |

---

## API Health Endpoint

A basic health endpoint should be added to handle status page checks. The simplest implementation is a static file served by Vercel:

**`public/api/health`** — Already exists as a public Vercel route. If not, create:
- `public/_api_health.json`: `{"status": "ok", "service": "jobline-ai"}`
- Add Vercel rewrite in `vercel.json` for `/api/health`

Or use the existing `rls-health` Supabase edge function as the health probe.

---

## Incident Management Workflow

When a monitor goes red:

1. **Instatus automatically** creates an incident and sets the component to "Degraded" or "Outage".
2. On-call engineer is notified via configured alert channels.
3. Engineer updates the incident with a status message within 15 minutes (FedRAMP IR-6 notification requirement).
4. Incident is resolved in Instatus once the monitor returns to green.
5. A post-incident update is posted within 24 hours of resolution.
6. For P1/P2 incidents affecting federal customers: notify per the Incident Response Plan within the required SLA.

---

## Evidence for FedRAMP

Once live, capture the following evidence for the ConMon package:

- Screenshot of `status.jobline.ai` showing all components green
- Screenshot of monitor configuration (showing check URLs and intervals)
- Screenshot of 30-day uptime history showing ≥ 99.9%

Store at: `docs/approval/fedramp/evidence/status-page-YYYY-QN.md`

---

## Current Status

- [x] Instatus account created (Starter / Free tier)
- [x] Page named `JobLine.ai Monitor` at `https://status-joblineai.instatus.com`
- [x] Cloudflare CNAME `status.jobline.ai → status.instatus.com` provisioned (dormant until Pro upgrade)
- [ ] Monitors configured (target: 10 monitors — fits Free 15-cap)
- [ ] Components grouped (Web App / API & Database / Background Services / Documentation)
- [ ] Email subscriber notifications enabled
- [ ] Link added to `https://jobline.ai/support` page (use `status-joblineai.instatus.com` until upgrade)
- [ ] 30-day baseline uptime data collected
- [ ] **Pro upgrade** — triggered by first federal prospect or ConMon evidence request
- [ ] Bind `status.jobline.ai` (post-upgrade)

**Status:** Operating on Free Starter tier. Sufficient for commercial customers and partial FedRAMP evidence (component grid + uptime history). **Pro upgrade required** before custom domain `status.jobline.ai` will resolve and before 30-second checks satisfy strict 99.9% SLA monitoring.

---

*This document satisfies FedRAMP G-16 (CP-2, SA-17): Status page operational runbook for JobLine AI.*
