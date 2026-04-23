# Status Page Runbook

**Service:** JobLine AI  
**FedRAMP Controls:** CP-2 (Contingency Plan), SA-17 (Developer Testing and Evaluation)  
**Gap Reference:** G-16  
**Last Updated:** April 2026

---

## Strategy: Phased Path from Free → FedRAMP

JobLine AI follows a **3-phase status page strategy** that starts free, gives us a branded URL early, and migrates cleanly into AWS GovCloud once FedRAMP authorization is in progress.

| Phase | Period | Engine | Public URL | Cost | FedRAMP-ready? |
|---|---|---|---|---|---|
| **Phase 0** (now) | Apr 2026 – ongoing | **UptimeRobot Free** (uptime monitoring + hosted public status page) | `stats.uptimerobot.com/Ac1v7E00v2` | $0 | ⚠️ Partial — commercial only |
| **Phase 1** (next) | Q2 2026 | **Upptime** (GitHub Actions + static site on Cloudflare Pages) | `status.jobline.ai` ✅ branded | $0 | ⚠️ Partial — commercial OK, audit-friendly |
| **Phase 2** (future) | Triggered by first federal LOI | **Statping-ng on AWS GovCloud ECS Fargate** | `status.jobline.ai` (DNS swap) | ~$15–40/mo | ✅ FedRAMP High inherited |

**Why not UptimeRobot Pro?** UptimeRobot's paid plans run on commercial AWS regions and are not FedRAMP-authorized. Paying $7+/mo would solve branding short-term but force a complete rebuild for federal customers. Upptime is free, gives us the same branded URL (`status.jobline.ai`), and preserves a clean GovCloud migration.

---

## Phase 0 — UptimeRobot Free (current state)

**Status:** ✅ Live and active.

- Public status page: `https://stats.uptimerobot.com/Ac1v7E00v2`
- Tier: Free — 50 monitors, 5-minute check interval, email/SMS alerts, no custom domain on free
- API key stored in Lovable Cloud secrets as `UPTIMEROBOT_API_KEY` (used for any future programmatic monitor sync from edge functions)
- Cloudflare CNAME `status.jobline.ai → status.instatus.com` is **dormant** (legacy from earlier Instatus trial — will be repointed in Phase 1 to the Upptime target, NOT to UptimeRobot since custom domains require a paid UptimeRobot plan).
- For now, link to the UptimeRobot URL directly from `/support`.

### Free tier vs Pro — what we get / don't get

| Capability | Free (current) | Pro (~$7/mo) |
|---|---|---|
| Monitors | 50 | 50+ |
| Check interval | 5 min | 1 min |
| Public status page | ✅ at `stats.uptimerobot.com/<id>` | ✅ at `status.jobline.ai` (custom domain) |
| Custom domain | ❌ | ✅ |
| Password-protect page | ✅ (in settings) | ✅ |
| SMS / voice alerts | Limited | Full |
| Status page branding (logo, colors) | ✅ basic | ✅ full |
| FedRAMP authorized | ❌ | ❌ |

**Conclusion:** Free tier is sufficient for commercial customers. We will NOT upgrade UptimeRobot Pro because it doesn't help with FedRAMP — the $7/mo is better spent on Phase 1 (Upptime) which gets us `status.jobline.ai` for free.

### Active monitor set (fits within Free 50-cap, 10 in use)

| # | Name | Type | Target | Expected |
|---|---|---|---|---|
| 1 | Marketing Site | HTTPS | `https://jobline.ai` | 200 |
| 2 | Web App | HTTPS | `https://app.jobline.ai` | 200 |
| 3 | Developer Portal | HTTPS | `https://dev.jobline.ai/dev` | 200 |
| 4 | Help Center | HTTPS | `https://docs.jobline.ai/help` | 200 |
| 5 | Supabase REST API | Keyword | `https://kgrstnbxqdmadtoankqr.supabase.co/rest/v1/` (header `apikey: <anon>`) | 200 |
| 6 | Supabase Auth | Keyword | `https://kgrstnbxqdmadtoankqr.supabase.co/auth/v1/health` | 200 |
| 7 | AI Planning Assistant | HTTPS | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/ai-planning-assistant` | not 5xx (401 expected) |
| 8 | Stripe Webhook | HTTPS | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/stripe-webhook` | not 5xx (400 expected) |
| 9 | Email Heartbeat | Cron/Heartbeat | URL pinged daily by `send-email` health check | < 24h since last ping |
| 10 | DNS A-record | Ping | `jobline.ai` | reachable |

### Component grouping (public page)

- **Web Application** — Marketing, Web App
- **API & Database** — Supabase REST, Supabase Auth
- **Background Services** — AI Planning Assistant, Stripe Webhook, Email Heartbeat
- **Documentation** — Developer Portal, Help Center

### UptimeRobot API (for future automation)

The `UPTIMEROBOT_API_KEY` secret is available to edge functions. Useful endpoints:
- `POST https://api.uptimerobot.com/v2/getMonitors` — fetch monitor status
- `POST https://api.uptimerobot.com/v2/newMonitor` — create monitor
- `POST https://api.uptimerobot.com/v2/getPSPs` — fetch public status page config

We are NOT building an in-app status widget yet — link directly to `stats.uptimerobot.com/Ac1v7E00v2`. If we later want to embed live status on `/support`, an edge function can call `getMonitors` and cache the result.

---

## Phase 1 — Upptime (branded `status.jobline.ai`, $0)

**Goal:** Get `status.jobline.ai` resolving with a clean, branded, audit-friendly status page without paying any vendor and without locking ourselves out of GovCloud migration.

### Why Upptime

- **$0 forever** — runs on GitHub Actions free tier (every 5 min, well under the 2,000 min/mo limit).
- **Markdown-based incidents** — every incident is a Git-tracked `.md` file. Auditors love this.
- **Static site output** — deploys as a plain HTML/CSS bundle to Cloudflare Pages or GitHub Pages. No server, no DB, no patching.
- **Branded custom domain** — `status.jobline.ai` works immediately via standard CNAME.
- **Migration-friendly** — incident history is portable Markdown; trivially imports into Statping-ng later.
- **Used by:** Cal.com, Snyk, GitGuardian, several .gov-adjacent orgs.

### Architecture

```
GitHub repo: jobline-ai/status (private)
   │
   ├── .upptimerc.yml             ← monitor config (same 10 endpoints as UptimeRobot)
   ├── history/*.yml              ← auto-generated uptime data, committed by Action
   ├── incidents/*.md             ← human-authored incident posts
   └── .github/workflows/*.yml    ← Upptime's check + site-build workflows
            │
            ▼
     Cloudflare Pages (static site)
            │
            ▼
   status.jobline.ai (CNAME → cloudflare-pages.dev)
```

### Setup steps (1–2 hours total)

1. **Create private GitHub repo** `jobline-ai/status` from the [Upptime template](https://github.com/upptime/upptime).
2. **Configure `.upptimerc.yml`** with the 10 monitors above (same URLs/expected codes as UptimeRobot).
3. **Set repo secrets:**
   - `GH_PAT` — fine-grained PAT with repo + pages write
   - `SUPABASE_ANON_KEY` — for Supabase API monitor headers
4. **Enable GitHub Actions** — Upptime's `uptime.yml` runs every 5 min and commits results.
5. **Build the static site** — Upptime's `site.yml` builds and deploys to Cloudflare Pages.
6. **Connect custom domain:**
   - Cloudflare DNS: change `status` CNAME from `status.instatus.com` → `<repo>.pages.dev`
   - Wait 5–30 min for cert issuance
   - Verify: `curl -sI https://status.jobline.ai/ | head -3` → expect `HTTP/2 200`
7. **Brand the page:** edit `.upptimerc.yml` — set logo URL, primary color `hsl(220 90% 56%)` (matches app), name "JobLine.ai Status".
8. **Wire up notifications:** Upptime can post to Slack/Discord/email via the same workflow.

### Operational workflow

| Event | Action |
|---|---|
| Monitor fails | GitHub Action auto-creates a GitHub Issue + commits a status flip |
| Incident declared | On-call writes `incidents/2026-04-22-supabase-degraded.md`, commits, site rebuilds in ~2 min |
| Incident resolved | Add `resolved: true` frontmatter to the .md, commit |
| Post-mortem | Add `postmortem.md` link to the incident frontmatter |

### Phase 1 acceptance criteria

- [ ] `https://status.jobline.ai/` returns 200 with branded JobLine page
- [ ] All 10 monitors checking every 5 min
- [ ] First incident drill completed (intentional 30-sec degrade + resolve)
- [ ] Slack incident notifications wired
- [ ] `https://jobline.ai/support` link updated to point at `status.jobline.ai`
- [ ] UptimeRobot kept as **secondary** monitoring engine for 30-day overlap, then optionally retained for SMS alerting (it's free)

---

## Phase 2 — AWS GovCloud + Statping-ng (FedRAMP-ready)

**Trigger:** First federal customer LOI signed, OR FedRAMP 3PAO kickoff.

### Why this stack

- **AWS GovCloud (us-gov-west-1)** is FedRAMP High authorized — anything we run there inherits that boundary.
- **Statping-ng** is a single Go binary with SQLite/Postgres backend, full incident management UI, and Docker-native. Lightweight enough to run on a single ECS Fargate task (~$15/mo) or t4g.small EC2 (~$12/mo).
- Self-hosted = no third-party CSP-on-CSP carve-out in the SSP.

### Target architecture

```
status.jobline.ai
      │
      ▼
AWS GovCloud (us-gov-west-1)
   ├── Route 53 (gov)
   ├── ACM cert (gov)
   ├── ALB → ECS Fargate (Statping-ng container)
   ├── RDS Postgres (t4g.micro, single-AZ for status data — no PII)
   └── CloudWatch Logs → SIEM (already wired for FedRAMP)
```

### Migration steps (Phase 1 → Phase 2)

1. Provision GovCloud account + base VPC (Terraform — should already exist for FedRAMP infra).
2. Deploy Statping-ng on Fargate via existing Terraform modules.
3. Import historical incidents from Upptime's `incidents/*.md` (one-time script — Statping-ng has a JSON import API).
4. Recreate the 10 monitors in Statping-ng UI (or YAML).
5. **Cutover DNS:** change `status` CNAME from Cloudflare Pages → GovCloud ALB. Cloudflare proxy: **off** (status pages should bypass CDN for accuracy).
6. Run Upptime + Statping-ng in parallel for 7 days; compare uptime numbers.
7. Archive Upptime repo (keep for historical evidence). Decommission UptimeRobot.
8. Update FedRAMP SSP: add status page as inherited control under GovCloud boundary.

### Phase 2 acceptance criteria

<<<<<<< HEAD
- [ ] Statping-ng running in `us-gov-west-1` with ALB + ACM cert
- [ ] All 10 monitors green for 7 consecutive days
- [ ] Historical incident data imported from Upptime
- [ ] SSP updated with status page boundary diagram
- [ ] CloudWatch → SIEM log pipeline confirmed
- [ ] 3PAO walkthrough scheduled

---
=======
### 4. Configure Public Backup Status Output

1. Enable UptimeRobot's public status page only if a customer-facing backup page is needed.
2. Record the public status URL in the incident runbook and support macros.
3. Do **not** treat the UptimeRobot page as the canonical application status page; it is a backup reference for outages affecting `jobline.ai/status` or `status.jobline.ai`.
4. If control of `status.jobline.ai` is later transferred, decide whether that hostname should point to the first-party static page or to the UptimeRobot public page.
>>>>>>> 1de3be6b (Add promotions hub and status-domain readiness updates)

## SLA Targets (publish on the page in all phases)

<<<<<<< HEAD
| Service | Uptime Target | RTO | RPO |
|---|---|---|---|
=======
In UptimeRobot settings:
- **Email subscribers:** Allow customers and agencies to subscribe to email notifications.
- **Slack webhook:** Optional — point to `#incidents` or `#ops` channel.
- **Webhook:** Configure to POST incident events to the `report-issue` edge function or an internal PagerDuty/OpsGenie integration.

### 6. SLA Targets to Publish

Publish the following SLA targets on the status page (matches ISCP):

| Service | Uptime Target | RTO | RPO |
|---------|--------------|-----|-----|
>>>>>>> 1de3be6b (Add promotions hub and status-domain readiness updates)
| Web App | 99.9% monthly | 4 hours | 1 hour |
| API | 99.9% monthly | 4 hours | 1 hour |
| Self-Hosted | 99.5% monthly | 24 hours | 24 hours |

---

## Incident Management Workflow (engine-agnostic)

<<<<<<< HEAD
1. Monitor fails → on-call paged within 60 sec (UptimeRobot email/SMS today; Slack/PagerDuty in Phase 1)
2. On-call posts initial status update within **15 minutes** (FedRAMP IR-6 requirement)
3. Status updates every 30 min until resolved
4. Post-incident update within 24 hours of resolution
5. Full post-mortem within 5 business days for P1/P2 incidents
6. For incidents affecting federal customers: notify per the IRP within the contractual SLA
=======
A basic health endpoint should be added to handle status page checks. The simplest implementation is a static file served by Vercel:

**`public/api/health`** — Already exists as a public Vercel route. If not, create:
- `public/_api_health.json`: `{"status": "ok", "service": "jobline-ai"}`
- Add Vercel rewrite in `vercel.json` for `/api/health`

Or use the existing `rls-health` Supabase edge function as the health probe.
>>>>>>> 1de3be6b (Add promotions hub and status-domain readiness updates)

---

## FedRAMP Evidence Capture

Once Phase 1 is live, capture quarterly:

<<<<<<< HEAD
- Screenshot of `status.jobline.ai` showing component grid
- Screenshot of monitor configuration (`.upptimerc.yml` or Statping-ng UI)
- 30/60/90-day uptime history showing ≥ 99.9%
- Any incident post-mortems from the period
=======
1. **UptimeRobot** sends the alert through the configured notification channels.
2. On-call engineer is notified via configured alert channels.
3. Engineer updates `https://jobline.ai/status` with a status message or incident note within 15 minutes (FedRAMP IR-6 notification requirement).
4. If the first-party page is unavailable, use the UptimeRobot public page or support broadcast channel as the fallback customer-facing update surface.
5. Incident is resolved in UptimeRobot once the monitor returns to green.
5. A post-incident update is posted within 24 hours of resolution.
6. For P1/P2 incidents affecting federal customers: notify per the Incident Response Plan within the required SLA.

---

## Evidence for FedRAMP

Once live, capture the following evidence for the ConMon package:

- Screenshot of `status.jobline.ai` showing all components green
- Screenshot of UptimeRobot monitor configuration (showing check URLs and intervals)
- Screenshot of 30-day uptime history showing ≥ 99.9%
>>>>>>> 1de3be6b (Add promotions hub and status-domain readiness updates)

Store at: `docs/approval/fedramp/evidence/status-page-YYYY-QN.md`

---

## Current Status (April 2026)

<<<<<<< HEAD
- [x] **Phase 0:** UptimeRobot Free account created, API key stored as `UPTIMEROBOT_API_KEY`
- [x] Public UptimeRobot URL live: `https://stats.uptimerobot.com/Ac1v7E00v2`
- [x] Cloudflare CNAME `status.jobline.ai → status.instatus.com` exists (dormant; will repoint in Phase 1)
- [ ] **Phase 0:** Configure all 10 monitors in UptimeRobot UI ← next action
- [ ] **Phase 0:** Add link from `/support` page to UptimeRobot status page
- [ ] **Phase 1: Upptime repo created**
- [ ] Phase 1: Upptime monitors mirror UptimeRobot set
- [ ] Phase 1: Cloudflare CNAME swap → Cloudflare Pages target
- [ ] Phase 1: `status.jobline.ai` resolves to branded JobLine page
- [ ] Phase 1: Incident drill completed
- [ ] Phase 1: UptimeRobot retained as secondary alerting (free) or decommissioned
- [ ] **Phase 2: AWS GovCloud account opened** (gated on federal LOI)
- [ ] Phase 2: Statping-ng deployed in `us-gov-west-1`
- [ ] Phase 2: DNS cutover + Upptime archived
- [ ] Phase 2: FedRAMP SSP updated
=======
- [ ] UptimeRobot workspace created
- [ ] Monitors configured
- [ ] Public backup status URL recorded in incident workflow
- [ ] Subscriber notifications enabled
- [ ] Link added to `https://jobline.ai/support` page
- [ ] 30-day baseline uptime data collected

**Status:** `https://jobline.ai/status` remains the primary first-party surface. UptimeRobot backup monitoring is the current external-observer path while `status.jobline.ai` remains outside direct repository-controlled Vercel configuration.
>>>>>>> 1de3be6b (Add promotions hub and status-domain readiness updates)

---

*This document satisfies FedRAMP G-16 (CP-2, SA-17): phased status page strategy with clear migration path into authorized boundary.*
