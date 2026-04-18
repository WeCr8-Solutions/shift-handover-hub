# SIEM Integration Guide

**Product:** JobLine AI  
**FedRAMP Controls:** AU-6 (Audit Review, Analysis, and Reporting), AU-9 (Protection of Audit Information)  
**Gap Reference:** G-07  
**Last Updated:** April 2026

---

## Overview

JobLine AI can forward audit log events to your organization's Security Information and Event Management (SIEM) system in real-time. This allows your security team to:

- Monitor JobLine activity alongside other enterprise systems
- Trigger alerts on anomalous behavior (mass data access, failed logins, role escalations)
- Retain audit logs in your SIEM for compliance and forensic purposes
- Satisfy FedRAMP AU-6 (audit review) by routing events to a centralized analysis platform

**Supported SIEM Platforms:**
- Splunk (via HTTP Event Collector)
- Microsoft Sentinel (via Log Ingestion API)
- IBM QRadar (via REST or syslog forwarding)
- Elastic SIEM (via Logstash/HTTP input)
- Any HTTP-capable SIEM (JSON or CEF format)

---

## Architecture

```
PostgreSQL activity_logs table
         │
         │  Supabase Database Webhook (on INSERT)
         ▼
  log-export edge function
         │
         ├── Reads: siem_configurations (org endpoint + auth)
         ├── Filters: event severity < min_severity → dropped
         ├── Formats: JSON or CEF
         │
         ▼
  SIEM Ingest Endpoint
  (Splunk HEC / Sentinel API / QRadar / Elastic / Custom)
```

Events are pushed on every new row inserted into `activity_logs`. The edge function is stateless and can handle high-throughput activity with sub-second latency.

---

## Event Schema (JSON format)

```json
{
  "id": "uuid",
  "activity_type": "login_success | login_failed | handoff_created | queue_item_updated | ...",
  "description": "Human-readable description of the event",
  "severity": "debug | info | warning | error",
  "user_id": "uuid",
  "user_email": "user@example.com",
  "user_display_name": "Jane Smith",
  "ip_address": "203.0.113.42",
  "metadata": { "key": "value" },
  "created_at": "2026-04-18T21:00:00Z",
  "org_id": "uuid",
  "_source": "jobline_ai"
}
```

---

## CEF Format

When **CEF (ArcSight Common Event Format)** is selected, events are sent as:

```
CEF:0|JobLineAI|JobLine|1.0|<activity_type>|<description>|<sev>|rt=<epoch_ms> suser=<user_id> email=<email> src=<ip> cs1=<org_id> cs1Label=orgId
```

CEF severity levels:
| JobLine severity | CEF level |
|-----------------|-----------|
| debug           | 1         |
| info            | 3         |
| warning         | 6         |
| error           | 9         |
| critical        | 10        |

---

## Activity Types Exported

| activity_type | Severity | Description |
|--------------|----------|-------------|
| `login_success` | info | User authenticated successfully |
| `login_failed` | warning | Failed authentication attempt |
| `mfa_enrolled` | info | User enrolled MFA factor |
| `mfa_challenge_failed` | warning | MFA verification failed |
| `handoff_created` | info | Shift handoff note created |
| `handoff_updated` | info | Shift handoff note modified |
| `queue_item_created` | info | Work queue item added |
| `queue_item_updated` | info | Work queue item modified |
| `user_invited` | info | Member invited to organization |
| `user_removed` | warning | Member removed from organization |
| `role_changed` | warning | Member role escalated or changed |
| `org_settings_changed` | warning | Organization settings modified |
| `siem_test` | info | Manual test event from admin UI |
| `ai_request` | info | AI Planning Assistant invoked |
| `ai_blocked` | warning | AI request blocked (injection / org disabled) |
| `session_revoked` | warning | Admin revoked a user session |

---

## Configuration

### In JobLine Admin UI

1. Sign in as an organization **admin** or **owner**.
2. Go to **Settings → Organization → SIEM Log Export**.
3. Toggle on **Enable SIEM Export**.
4. Select your **SIEM Provider**.
5. Enter the **Ingest Endpoint URL** (see provider-specific steps below).
6. Enter the **Auth Header Name** and **Auth Token / API Key**.
7. Select **Event Format** (JSON or CEF).
8. Set **Minimum Severity** — events below this level are silently dropped.
9. Click **Save SIEM Settings**.
10. Click **Send Test Event** to verify connectivity.

---

## Provider-Specific Setup

### Splunk HTTP Event Collector (HEC)

1. In Splunk Web, go to **Settings → Data Inputs → HTTP Event Collector → New Token**.
2. Name the token `jobline-ai` and select an appropriate index (e.g., `security`).
3. Copy the **HEC Token**.
4. In JobLine:
   - **Endpoint URL:** `https://your-splunk-host:8088/services/collector`
   - **Auth Header Name:** `Authorization`
   - **Auth Token:** `Splunk <your-hec-token>` (prefix with "Splunk ")
   - **Format:** JSON

**Splunk Search:** `index=security source=jobline_ai | table created_at, activity_type, user_email, ip_address, description`

---

### Microsoft Sentinel (Log Ingestion API)

1. In Azure Portal, go to **Microsoft Sentinel → Settings → Workspace settings → Data collection rules**.
2. Create a new **custom log** table (e.g., `JobLineAI_CL`).
3. Note the **Data Collection Endpoint URI** and **DCR Immutable ID**.
4. Create an **App Registration** with the `Monitoring Metrics Publisher` role on the DCR.
5. Generate a client secret.
6. In JobLine:
   - **Endpoint URL:** `https://<endpoint>.ingest.monitor.azure.com/dataCollectionRules/<dcr-id>/streams/Custom-JobLineAI_CL?api-version=2023-01-01`
   - **Auth Header Name:** `Authorization`
   - **Auth Token:** `Bearer <oauth-token>` (use a token from your App Registration client credentials flow)
   - **Format:** JSON

**Note:** Sentinel's Log Ingestion API requires OAuth 2.0 Bearer tokens, which expire. For production use, configure a token-refresh mechanism or use a managed identity.

---

### IBM QRadar

1. In QRadar, go to **Admin → Data Sources → Log Sources → Add**.
2. Select **Universal Cloud REST API** or configure a syslog listener.
3. For REST ingestion:
   - **Endpoint:** `https://your-qradar.example.com/api/siem/offenses` (use appropriate endpoint for your version)
   - **Auth Header:** `SEC <qradar-sec-token>`
4. Alternatively, configure JobLine to forward CEF-formatted events to a syslog listener on QRadar (format: CEF).

---

### Elastic SIEM (Logstash HTTP Input)

1. Configure a [Logstash HTTP input plugin](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-http.html):
   ```ruby
   input {
     http {
       port => 8080
       codec => "json"
       additional_codecs => { "application/json" => "json" }
       password => "your-secret"
     }
   }
   output {
     elasticsearch {
       hosts => ["https://your-elastic:9200"]
       index => "jobline-audit-%{+YYYY.MM.dd}"
     }
   }
   ```
2. In JobLine:
   - **Endpoint URL:** `http://your-logstash-host:8080/`
   - **Auth Header Name:** `Authorization`
   - **Auth Token:** `Basic <base64(user:password)>` or configure no auth with network-level restrictions
   - **Format:** JSON

---

### Custom HTTP Endpoint

Any HTTP server that accepts POST requests with a JSON or CEF body can receive JobLine events. The `log-export` function POSTs to the configured URL with:

- **Content-Type:** `application/json` or `text/plain` (CEF)
- **Auth header:** the configured header name and token value
- **Body:** the event JSON or CEF string

Ensure your endpoint returns HTTP 2xx on success; any non-2xx response will increment the error counter.

---

## Monitoring Export Health

The SIEM settings card shows:
- **Last successful export timestamp** — updated after every successful delivery
- **Export error count** — incremented on each HTTP delivery failure; reset to 0 on success

If the error count is non-zero:
1. Click **Send Test Event** to check current connectivity.
2. Verify the endpoint URL is reachable from the Supabase edge function network.
3. Verify the auth token has not expired or been revoked.
4. Check the edge function logs in the Supabase dashboard (Functions → log-export → Logs).

---

## Security Considerations

- **Auth tokens are stored server-side** in the `siem_configurations` table, accessible only to organization admins and the service role. They are never sent to the browser in plaintext after initial save.
- **The log-export edge function runs with service role privileges** — it reads SIEM configuration and forwards events. It does not expose individual user data beyond what is in the `activity_logs` row.
- **TLS is required** for all SIEM endpoints. HTTP (non-TLS) endpoints will be accepted in configuration but are not recommended. For FedRAMP deployments, TLS 1.2+ is required (SC-8, SC-28).
- **Audit logs cannot be deleted by org admins** — RLS on `activity_logs` does not permit DELETE for any authenticated role. This satisfies AU-9 (protection of audit information).

---

## Evidence for FedRAMP AU-6

To satisfy AU-6 (Audit Review, Analysis, and Reporting) in your POA&M:

1. Enable SIEM export and confirm connectivity via **Send Test Event**.
2. Screenshot the SIEM settings card showing `enabled = true`, endpoint URL, and last export timestamp.
3. Log in to your SIEM and demonstrate that JobLine events appear in the expected index/table.
4. Save screenshots to: `docs/approval/fedramp/evidence/siem-au6-evidence-YYYY-QN.md`

---

*This document satisfies FedRAMP G-07 (AU-6, AU-9): SIEM Log Export integration guide for JobLine AI.*
