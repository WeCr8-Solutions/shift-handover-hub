# Subdomain & DNS Setup Runbook (IONOS + Cloudflare)

**Last updated:** April 2026  
**Registrar:** IONOS  
**DNS / proxy:** Cloudflare  
**Apex:** `jobline.ai`

This document covers every subdomain on `jobline.ai`, what each one is for, and how to verify or fix it. It also explains the two records IONOS auto-creates (`_domainconnect`, `autodiscover`) and whether to keep, remove, or reconfigure them.

---

## 1. Current status (verified)

| Hostname | Resolves | HTTPS | Notes |
|---|---|---|---|
| `jobline.ai` | ✅ | 200 | Marketing site (Lovable / Vercel) |
| `www.jobline.ai` | ✅ | 200 | Redirect / mirror of apex |
| `docs.jobline.ai` | ✅ | 200 | Docs site |
| `dev.jobline.ai` | ✅ | 200 | Staging / DAST target |
| **`app.jobline.ai`** | ✅ | **403** | DNS works, **no host bound on origin yet** |
| **`status.jobline.ai`** | ✅ | **403** | DNS works, **Instatus custom domain not finalized** |
| `autodiscover.jobline.ai` | (auto) | — | IONOS auto-record — see §4 |
| `_domainconnect.jobline.ai` | (auto) | — | IONOS auto-record — see §4 |

> A `403` on a subdomain means DNS is correctly pointing somewhere, but the destination doesn't yet recognize the hostname. This is a **destination-side** fix, not a DNS fix.

---

## 2. `app.jobline.ai` — finishing the bind

**Intended target:** the Lovable-published web app (currently `joblineai.lovable.app`).

### Cloudflare DNS (already done by you)
```
Type:   CNAME
Name:   app
Target: joblineai.lovable.app          (or whichever Lovable host you use)
Proxy:  Proxied (orange cloud) is fine for Lovable; DNS-only also works
TTL:    Auto
```

### Lovable side (this is the missing step → fixes the 403)
1. Open **Project Settings → Domains** in Lovable.
2. Click **Connect Domain** → enter `app.jobline.ai`.
3. Lovable will show either:
   - An **A record** (`185.158.133.1`) + a `_lovable` TXT for verification, **or**
   - A **CNAME** verification path if you check **"Domain uses Cloudflare or a similar proxy"** under Advanced.
4. Because you are proxying through Cloudflare, **enable the "Domain uses Cloudflare" advanced option** so Lovable issues a CNAME-based cert. Otherwise SSL provisioning will fail behind the orange cloud.
5. Wait for status to flip from **Verifying → Setting up → Active**.

### Verify
```bash
curl -sI https://app.jobline.ai | head -5
# Expect: HTTP/2 200  (and a Lovable / Vercel server header)
```

---

## 3. `status.jobline.ai` — finishing Instatus

**Intended target:** Instatus public status page (`jobline.instatus.com`).

### Cloudflare DNS (already done by you)
```
Type:   CNAME
Name:   status
Target: jobline.instatus.com
Proxy:  DNS only (gray cloud)   ← REQUIRED. Instatus issues its own cert.
TTL:    Auto
```

If the proxy is currently **orange (proxied)**, switch it to **gray (DNS only)** — Instatus cannot issue a TLS cert through Cloudflare's proxy and will return 403 until this is corrected.

### Instatus side (the likely missing step)
1. In Instatus → **Settings → Custom Domain** → enter `status.jobline.ai`.
2. Instatus shows "Pending" until it verifies the CNAME and provisions Let's Encrypt.
3. Status flips to **Active** within 5–30 minutes once the proxy is gray.

### Verify
```bash
curl -sI https://status.jobline.ai | head -5
# Expect: HTTP/2 200 with `server: instatus` or similar
```

Full operational runbook for the status page itself: [`docs/enterprise/status-page-runbook.md`](./status-page-runbook.md).

---

## 4. `_domainconnect` and `autodiscover` — what they are

These two records are **created automatically by IONOS** when a domain is registered there. They are **not** something you typically configure — and in most cases for a SaaS web app, you can ignore or remove them. Here is what each one does:

### 4.1 `_domainconnect.jobline.ai`
- **What it is:** A discovery record for the [Domain Connect](https://www.domainconnect.org/) protocol — an open standard that lets services like Microsoft 365, Google Workspace, GoDaddy, etc. **automatically write DNS records** into your zone after you click an "Add to my domain" button on their setup wizard.
- **IONOS default:** A `TXT` (or sometimes `CNAME`) record pointing at `_domainconnect.ionos.com` (or the IONOS DC API endpoint).
- **Do you need it?** **No, not for JobLine.** You manage DNS in **Cloudflare**, not IONOS. Domain Connect on the IONOS record will not propagate edits to Cloudflare anyway.
- **Recommendation:** Leave it alone if it doesn't cause issues, or **delete it from Cloudflare** to keep the zone clean. It is harmless either way — it's only consulted by third-party setup wizards.

### 4.2 `autodiscover.jobline.ai`
- **What it is:** A legacy **Microsoft Exchange / Outlook** discovery record. When a user types their email into Outlook, the client queries `autodiscover.<domain>` to find the mail server config.
- **IONOS default:** `CNAME autodiscover → autodiscover.ionos.com` (because IONOS sells email hosting).
- **Do you need it?** **Only if** you actually use IONOS email for `@jobline.ai`. If your company email runs on **Google Workspace, Microsoft 365, or Resend-only**, this record is wrong/misleading.
- **Recommendation by mail provider:**
  - **Google Workspace:** Delete the IONOS `autodiscover` record. (Google uses MX + SPF/DKIM/DMARC, no autodiscover needed.)
  - **Microsoft 365:** Replace with `CNAME autodiscover → autodiscover.outlook.com`.
  - **IONOS Mail:** Leave as-is.
  - **Resend / transactional only, no inboxes:** Delete it.

> JobLine currently uses **Resend** for transactional email from `notifications@jobline.ai` (see `mem://technical/infrastructure/email-configuration`). Unless human inboxes are hosted on IONOS, **delete `autodiscover`** from Cloudflare to avoid confusing Outlook clients.

---

## 5. Required vs optional records — full reference table

Records you should **have** in Cloudflare for `jobline.ai`:

| Record | Type | Target | Proxy | Purpose | Required? |
|---|---|---|---|---|---|
| `@` (apex) | A | `185.158.133.1` *(or Vercel/Lovable IP)* | 🟠 Proxied | Marketing site | ✅ Yes |
| `www` | CNAME | `jobline.ai` | 🟠 Proxied | www → apex | ✅ Yes |
| `app` | CNAME | `joblineai.lovable.app` | 🟠 Proxied | Web app | ✅ Yes |
| `status` | CNAME | `jobline.instatus.com` | ⚪ DNS only | Status page | ✅ Yes |
| `docs` | CNAME | (docs host) | 🟠 Proxied | Docs | ✅ Yes |
| `dev` | CNAME | (Lovable preview / Vercel) | 🟠 Proxied | Staging / DAST | ✅ Yes |
| `_lovable` | TXT | `lovable_verify=…` | — | Lovable domain verify | ✅ Yes (per domain) |
| **Email — Resend** | | | | | |
| `@` | TXT | `v=spf1 include:_spf.resend.com ~all` | — | SPF | ✅ If sending email |
| `resend._domainkey` | TXT | (DKIM key from Resend) | — | DKIM | ✅ If sending email |
| `_dmarc` | TXT | `v=DMARC1; p=quarantine; rua=mailto:dmarc@jobline.ai` | — | DMARC | ✅ Strongly recommended |
| **Optional** | | | | | |
| `autodiscover` | — | (delete unless using IONOS/M365 mail) | — | Outlook autoconfig | ⚪ Optional / remove |
| `_domainconnect` | — | (delete; Cloudflare-managed zone) | — | Domain Connect | ⚪ Optional / remove |
| `mail` | CNAME | (mail provider) | ⚪ DNS only | Webmail vanity URL | ⚪ Optional |
| `_acme-challenge` | TXT | (auto by Cloudflare) | — | Wildcard cert | ⚪ Auto |

---

## 6. Step-by-step: clean up IONOS-leaked records in Cloudflare

1. Log in to **Cloudflare → jobline.ai → DNS → Records**.
2. Filter by name `autodiscover` and `_domainconnect`.
3. For each one, decide using §4 above. Default for JobLine is **Delete both**.
4. Confirm with:
   ```bash
   curl -s "https://dns.google/resolve?name=autodiscover.jobline.ai&type=CNAME" | jq
   curl -s "https://dns.google/resolve?name=_domainconnect.jobline.ai&type=TXT" | jq
   # Expect: "Status": 3 (NXDOMAIN) once removed and propagated.
   ```

---

## 7. Step-by-step: confirm IONOS is **not** still authoritative

Because the domain is registered at IONOS but DNS is delegated to Cloudflare, IONOS's nameservers must **not** be active. Verify:

```bash
nix run nixpkgs#bind -- dig NS jobline.ai +short
# Expect 2 Cloudflare nameservers, e.g.
#   xxx.ns.cloudflare.com.
#   yyy.ns.cloudflare.com.
```

If you see `ns1071.ui-dns.com` or similar (IONOS), the domain is still on IONOS DNS and any Cloudflare records are being ignored. Fix: in IONOS → Domains → `jobline.ai` → **Nameservers** → set to the two nameservers Cloudflare assigned to your zone.

---

## 8. Quick checklist after this runbook

- [ ] `app.jobline.ai` registered inside Lovable Project Settings (with "Cloudflare proxy" advanced flag) → returns **200**
- [ ] `status.jobline.ai` set as Custom Domain inside Instatus, Cloudflare proxy is **gray** → returns **200**
- [ ] `autodiscover` removed from Cloudflare (unless using IONOS/M365 mail)
- [ ] `_domainconnect` removed from Cloudflare
- [ ] `dig NS jobline.ai` shows **only Cloudflare** nameservers
- [ ] SPF/DKIM/DMARC present for Resend
- [ ] Cloudflare SSL/TLS mode set to **Full (strict)** for the zone

---

---

## 9. Subdomain content routing (in-app)

All `*.jobline.ai` hosts serve the same Lovable SPA. Without an in-app
rewrite, every subdomain lands on the marketing homepage. This is handled by
`src/lib/subdomainRouting.ts`, called from `src/main.tsx` before the React
root mounts:

| Host | Rewrites root `/` to | Notes |
|---|---|---|
| `jobline.ai`, `www.jobline.ai` | (no rewrite) | Marketing home |
| `app.jobline.ai` | `/` | Placeholder; app shell not bound yet |
| `dev.jobline.ai` | `/dev` | Developer Portal |
| `docs.jobline.ai` | `/help` | Help Center / Docs |
| `status.jobline.ai` | external `https://jobline.instatus.com` | DNS should already point at Instatus; this is a safety net |

The rewrite ONLY fires when `window.location.pathname === "/"`, so deep
links like `dev.jobline.ai/dev/sap/overview` are preserved untouched. To add
a new subdomain: add a `HOST_MAP` entry in `subdomainRouting.ts` AND
register the Cloudflare CNAME + Lovable custom domain.

---

## 10. Security hardening per subdomain (HTTPS redirect + HSTS)

Cloudflare's quarterly Security Insights flags any hostname in the zone
that is not enforcing HTTPS redirects or HSTS. Because not every JobLine
subdomain is proxied through Cloudflare (orange-cloud), the fix location
depends on **who terminates TLS** for that hostname.

### Decision matrix

| Hostname | TLS terminator | "Always Use HTTPS" set on | "HSTS" set on |
|---|---|---|---|
| `jobline.ai`, `www.`, `app.`, `dev.`, `docs.` | Cloudflare proxy (🟠) | Cloudflare zone setting | Cloudflare → SSL/TLS → Edge Certificates → HSTS |
| `status.jobline.ai` | **Instatus** (⚪ DNS-only, required) | **Instatus** dashboard | **Instatus** dashboard |
| `*.lovable.app` (Lovable preview) | Lovable / Vercel | Already enforced by platform | Already enforced by platform |

> Cloudflare cannot apply Always-Use-HTTPS or HSTS to a **gray-cloud / DNS-only** hostname because traffic never traverses its edge. Re-proxying `status.` through Cloudflare would break Instatus's Let's Encrypt renewal flow (see §3). Always fix at the TLS terminator.

### 10.1 Cloudflare-proxied hostnames (default for all `jobline.ai` apex/web subdomains)

1. Cloudflare → **SSL/TLS → Overview** → mode = **Full (strict)**.
2. Cloudflare → **SSL/TLS → Edge Certificates**:
   - **Always Use HTTPS:** ON
   - **Automatic HTTPS Rewrites:** ON
   - **Minimum TLS Version:** 1.2 (1.3 preferred)
   - **HSTS:** ON with:
     - `max-age` = `31536000` (1 year)
     - `includeSubDomains` = ON
     - `preload` = **OFF** unless every subdomain (`status.`, `app.`, `dev.`, `docs.`, `www.`, apex, plus any future ones) is verified HTTPS-only and you intend to submit to the [HSTS preload list](https://hstspreload.org/). Preload is irreversible in practice.
     - `No-Sniff Header` = ON

### 10.2 `status.jobline.ai` (Instatus, DNS-only)

In **Instatus → Settings → Custom Domain** for `status.jobline.ai`:

1. Confirm the Let's Encrypt certificate status is **Active** (green).
2. Enable **Force HTTPS** / **Redirect HTTP → HTTPS**.
3. Enable **HSTS** (available on Instatus Business and above). Recommended value:
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```
   Do **NOT** enable `preload` from Instatus — preload directives apply to the entire `jobline.ai` zone, and zone-level preload must be coordinated from Cloudflare (§10.1) after every subdomain is HTTPS-only.
4. If your Instatus plan does not expose an HSTS toggle, the only alternatives are:
   - Upgrade the Instatus plan, **or**
   - Move status to a self-hosted page behind Cloudflare (changes ownership model — not recommended).

### 10.3 Verification

```bash
# Expect: 301/308 to https, then HSTS header on the https response
curl -sI http://status.jobline.ai | grep -i location
curl -sI https://status.jobline.ai | grep -i strict-transport-security

# Same checks for proxied hosts
for host in jobline.ai www.jobline.ai app.jobline.ai dev.jobline.ai docs.jobline.ai; do
  echo "== $host =="
  curl -sI "http://$host" | grep -i location
  curl -sI "https://$host" | grep -i strict-transport-security
done
```

A green run means Cloudflare's Security Insights "Domains without 'Always Use HTTPS'" and "Domains without HSTS" findings will clear on the next scan (next quarterly cycle, or trigger a manual rescan from Cloudflare's Security Center).

### 10.4 Recurring-finding triage

If Cloudflare re-flags `status.jobline.ai` after Instatus is configured:
1. Re-run the `curl -sI` checks above.
2. If `Strict-Transport-Security` is missing on HTTPS, the Instatus HSTS toggle was disabled or the plan was downgraded — re-enable per §10.2.
3. If `Location:` is missing on HTTP, the Instatus Force HTTPS toggle is off — re-enable per §10.2.
4. If both headers are present and Cloudflare still flags it, the finding is a stale scan — acknowledge/dismiss the insight in Cloudflare Security Center with a note pointing back to this section.

---

**Owner:** Platform / Infra  
**Related docs:**  
- `docs/enterprise/status-page-runbook.md`  
- `mem://technical/infrastructure/email-configuration`  
- `mem://technical/deployment/vercel-routing-spa`  
- `mem://technical/routing/subdomain-routing`
