# Status Page Runbook

**Service:** JobLine AI
**FedRAMP Controls:** CP-2 (Contingency Plan), SA-17 (Developer Testing and Evaluation)
**Gap Reference:** G-16
**Last Updated:** April 2026

---

## Strategy: Phased Path from Free → FedRAMP

JobLine AI follows a **3-phase status page strategy** that starts free, gives us a branded URL immediately, and migrates cleanly into AWS GovCloud once FedRAMP authorization is in progress.

| Phase | Period | Engine | Public URL | Cost | FedRAMP-ready? |
|---|---|---|---|---|---|
| **Phase 0** (now) | Apr 2026 – ongoing | **Instatus Free** (uptime monitoring only) | `status-joblineai.instatus.com` | $0 | ⚠️ Partial — commercial only |
| **Phase 1** (next) | Q2 2026 | **Upptime** (GitHub Actions + static site on Cloudflare Pages / Vercel) | `status.jobline.ai` ✅ branded | $0 | ⚠️ Partial — commercial OK, audit-friendly |
| **Phase 2** (future) | Triggered by first federal LOI | **Statping-ng on AWS GovCloud ECS Fargate** | `status.jobline.ai` (DNS swap) | ~$15–40/mo | ✅ FedRAMP High inherited |

**Why not Instatus Pro?** Instatus runs on commercial Vercel/AWS regions and is not FedRAMP-authorized. Paying $20/mo would solve branding short-term but force a complete rebuild for federal customers. Upptime is free and gives us the same branded URL today, while preserving a clean GovCloud migration.

---

## Phase 0 — Instatus Free (current state)

**Status:** ✅ Live and configured.

- Public URL: `https://status-joblineai.instatus.com`
- Tier: Starter (Free) — 15 monitors, 2-min check interval, email notifications, no custom domain
- Used as: backend uptime monitoring engine + interim public status surface
- Cloudflare CNAME: `status.jobline.ai → status.instatus.com` is provisioned but **dormant** (Instatus rejects custom hostnames on free tier — verified `curl -sI https://status.jobline.ai/` returns nothing).

### Active monitor set (fits within Free 15-cap)

| # | Name | Type | Target | Expected |
|---|---|---|---|---|
| 1 | Marketing Site | Website | `https://jobline.ai` | 200 |
| 2 | Web App | Website | `https://app.jobline.ai` | 200 |
| 3 | Developer Portal | Website | `https://dev.jobline.ai/dev` | 200 |
| 4 | Help Center | Website | `https://docs.jobline.ai/help` | 200 |
| 5 | Supabase REST API | API | `https://kgrstnbxqdmadtoankqr.supabase.co/rest/v1/` (header `apikey: <anon>`) | 200 |
| 6 | Supabase Auth | API | `https://kgrstnbxqdmadtoankqr.supabase.co/auth/v1/health` | 200 |
| 7 | AI Planning Assistant | API | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/ai-planning-assistant` | not 5xx (401 expected) |
| 8 | Stripe Webhook | API | `https://kgrstnbxqdmadtoankqr.functions.supabase.co/stripe-webhook` | not 5xx (400 expected) |
| 9 | Email Heartbeat | Cron/Heartbeat | URL pinged daily by `send-email` health check | < 24h since last ping |
| 10 | DNS A-record | DNS | `jobline.ai` A | `185.158.133.1` |

### Component grouping (public page)

- **Web Application** — Marketing, Web App
- **API & Database** — Supabase REST, Supabase Auth
- **Background Services** — AI Planning Assistant, Stripe Webhook, Email Heartbeat
- **Documentation** — Developer Portal, Help Center

---

## Phase 1 — Upptime (branded `status.jobline.ai`, $0)

**Goal:** Get `status.jobline.ai` resolving with a clean, branded, audit-friendly status page without paying Instatus and without locking ourselves out of GovCloud migration.

### Why Upptime

- **$0 forever** — runs on GitHub Actions free tier (every 5 min, well under the 2,000 min/mo limit).
- **Markdown-based incidents** — every incident is a Git-tracked `.md` file. Auditors love this.
- **Static site output** — deploys as a plain HTML/CSS bundle to Cloudflare Pages or Vercel. No server, no DB, no patching.
- **Branded custom domain** — `status.jobline.ai` works immediately via standard CNAME.
- **Migration-friendly** — incident history is portable Markdown; trivially imports into Statping-ng later.
- **Used by:** Cal.com, Snyk, GitGuardian, several .gov-adjacent orgs.

### Architecture

```
GitHub repo: jobline-ai/status (private)
   │
   ├── .upptimerc.yml             ← monitor config (same 10 endpoints as Instatus)
   ├── history/*.yml              ← auto-generated uptime data, committed by Action
   ├── incidents/*.md             ← human-authored incident posts
   └── .github/workflows/*.yml    ← Upptime's check + site-build workflows
            │
            ▼
     GitHub Pages OR Cloudflare Pages (static site)
            │
            ▼
   status.jobline.ai (CNAME → cloudflare-pages.dev)
```

### Setup steps (1–2 hours total)

1. **Create private GitHub repo** `jobline-ai/status` from the [Upptime template](https://github.com/upptime/upptime).
2. **Configure `.upptimerc.yml`** with the 10 monitors above (same URLs/expected codes as Instatus).
3. **Set repo secrets:**
   - `GH_PAT` — fine-grained PAT with repo + pages write
   - `SUPABASE_ANON_KEY` — for Supabase API monitor headers
4. **Enable GitHub Actions** — Upptime's `uptime.yml` runs every 5 min and commits results.
5. **Build the static site** — Upptime's `site.yml` builds and deploys to GitHub Pages (or Cloudflare Pages).
6. **Connect custom domain:**
   - Cloudflare DNS: change `status` CNAME from `status.instatus.com` → `<repo>.pages.dev` (or GitHub Pages target)
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
- [ ] Instatus kept as **secondary** monitoring engine for 30-day overlap, then decommissioned

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
7. Archive Upptime repo (keep for historical evidence).
8. Update FedRAMP SSP: add status page as inherited control under GovCloud boundary.

### Phase 2 acceptance criteria

- [ ] Statping-ng running in `us-gov-west-1` with ALB + ACM cert
- [ ] All 10 monitors green for 7 consecutive days
- [ ] Historical incident data imported from Upptime
- [ ] SSP updated with status page boundary diagram
- [ ] CloudWatch → SIEM log pipeline confirmed
- [ ] 3PAO walkthrough scheduled

---

## SLA Targets (publish on the page in all phases)

| Service | Uptime Target | RTO | RPO |
|---|---|---|---|
| Web App | 99.9% monthly | 4 hours | 1 hour |
| API | 99.9% monthly | 4 hours | 1 hour |
| Self-Hosted | 99.5% monthly | 24 hours | 24 hours |

---

## Incident Management Workflow (engine-agnostic)

1. Monitor fails → on-call paged within 60 sec (Slack/email/PagerDuty)
2. On-call posts initial status update within **15 minutes** (FedRAMP IR-6 requirement)
3. Status updates every 30 min until resolved
4. Post-incident update within 24 hours of resolution
5. Full post-mortem within 5 business days for P1/P2 incidents
6. For incidents affecting federal customers: notify per the IRP within the contractual SLA

---

## FedRAMP Evidence Capture

Once Phase 1 is live, capture quarterly:

- Screenshot of `status.jobline.ai` showing component grid
- Screenshot of monitor configuration (`.upptimerc.yml` or Statping-ng UI)
- 30/60/90-day uptime history showing ≥ 99.9%
- Any incident post-mortems from the period

Store at: `docs/approval/fedramp/evidence/status-page-YYYY-QN.md`

---

## Current Status (April 2026)

- [x] **Phase 0:** Instatus Free account created, 10 monitors planned
- [x] Cloudflare CNAME `status.jobline.ai → status.instatus.com` provisioned (dormant)
- [x] Public Instatus URL live: `https://status-joblineai.instatus.com`
- [ ] **Phase 0 monitors configured** (in Instatus UI)
- [ ] **Phase 1: Upptime repo created** ← next action
- [ ] Phase 1: Upptime monitors mirror Instatus set
- [ ] Phase 1: Cloudflare CNAME swap → Cloudflare Pages target
- [ ] Phase 1: `status.jobline.ai` resolves to branded JobLine page
- [ ] Phase 1: Incident drill completed
- [ ] Phase 1: Instatus decommissioned after 30-day overlap
- [ ] **Phase 2: AWS GovCloud account opened** (gated on federal LOI)
- [ ] Phase 2: Statping-ng deployed in `us-gov-west-1`
- [ ] Phase 2: DNS cutover + Upptime archived
- [ ] Phase 2: FedRAMP SSP updated

---

*This document satisfies FedRAMP G-16 (CP-2, SA-17): phased status page strategy with clear migration path into authorized boundary.*
