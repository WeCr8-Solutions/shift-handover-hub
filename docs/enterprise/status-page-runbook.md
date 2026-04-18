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

Instatus is the recommended provider for its simplicity, FedRAMP-appropriate uptime SLA, and custom domain support.

**Alternative:** Better Uptime, UptimeRobot Status Pages, Atlassian Statuspage, or Freshstatus.

---

## Setup Steps (Instatus)

### 1. Create Account and Site

1. Sign up at [instatus.com](https://instatus.com).
2. Create a new page named `JobLine AI Status`.
3. Set the subdomain to `jobline` (results in `jobline.instatus.com` initially).

### 2. Add Monitors

Add the following monitors (each with 1-minute check interval):

| Name | URL | Type | Alert on |
|------|-----|------|----------|
| JobLine Web App | `https://jobline.ai` | HTTP(S) GET | Status ≠ 200 |
| API Health | `https://jobline.ai/api/health` | HTTP(S) GET | Status ≠ 200 |
| Auth Service | `https://<supabase-project>.supabase.co/auth/v1/health` | HTTP(S) GET | Status ≠ 200 |
| Edge Functions | `https://<supabase-project>.supabase.co/functions/v1/rls-health` | HTTP(S) GET | Status ≠ 200 |

### 3. Add Components

Add components matching the monitored services:

- **Web Application** — `jobline.ai` SPA and CDN (Vercel)
- **API & Database** — Supabase PostgreSQL and Auth
- **AI Planning Assistant** — Edge function (ai-planning-assistant)
- **SIEM Log Export** — Edge function (log-export)
- **Electron Desktop App** — Distribution and update server

### 4. Configure Custom Domain

1. In Instatus site settings, go to **Custom Domain** and enter `status.jobline.ai`.
2. In Cloudflare DNS (or your DNS provider), add:
   ```
   Type: CNAME
   Name: status
   Target: jobline.instatus.com
   Proxy: DNS only (gray cloud) — Instatus requires direct CNAME
   ```
3. Wait for DNS propagation (typically 5–30 minutes).
4. Verify by visiting `https://status.jobline.ai`.

### 5. Configure Incident Notifications

In Instatus settings:
- **Email subscribers:** Allow customers and agencies to subscribe to email notifications.
- **Slack webhook:** Optional — point to `#incidents` or `#ops` channel.
- **Webhook:** Configure to POST incident events to the `report-issue` edge function or an internal PagerDuty/OpsGenie integration.

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

- [ ] Instatus account created
- [ ] Monitors configured
- [ ] Custom domain `status.jobline.ai` DNS configured and verified
- [ ] Subscriber notifications enabled
- [ ] Link added to `https://jobline.ai/support` page
- [ ] 30-day baseline uptime data collected

**Status:** Pending DNS setup and Instatus account creation. Configuration guide is complete (this document).

---

*This document satisfies FedRAMP G-16 (CP-2, SA-17): Status page operational runbook for JobLine AI.*
