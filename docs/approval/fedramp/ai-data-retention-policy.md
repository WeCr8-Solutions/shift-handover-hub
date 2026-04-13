# AI Data Retention and Processing Policy
**Organization:** WeCr8 Solutions (JobLine AI)  
**Version:** 1.0  
**Date:** April 13, 2026  
**Classification:** Internal + Customer-Facing  
**Owner:** Engineering Lead  
**Approved By:** CEO  
**Review Cycle:** Annual; when AI features change significantly  
**NIST Controls:** AU-11, MP-6, SA-9, AC-20  

---

## 1. Purpose

This policy defines how WeCr8 Solutions retains, processes, and disposes of data that is processed by the AI features in JobLine AI, specifically the AI Planning Assistant. It addresses data minimization, retention limits, and customer control requirements for AI-processed content.

---

## 2. Scope

This policy applies to all AI-powered features in JobLine AI:
- **AI Planning Assistant** (`supabase/functions/ai-planning-assistant/`) — shift planning recommendations

---

## 3. What Data AI Features Process

The AI Planning Assistant may process the following data types to generate recommendations:

| Data Category | Examples | Sensitivity |
|--------------|---------|-------------|
| Shift handoff notes | Notes entered by operators about shift conditions | Internal business data |
| Work order context | Job IDs, status, notes provided as planning context | Internal business data |
| NCR descriptions | Non-conformance descriptions provided as context | Internal business data |
| User-supplied prompts | Questions typed by operators into the AI assistant | User-generated |

**What is NOT sent to the AI:**
- Raw database records (full tables are never passed)
- Personally Identifiable Information (PII) beyond first names used in shift notes
- Passwords, tokens, API keys, or credentials
- Payment information (Stripe handles payments independently)

---

## 4. Data Flow

```
User prompt (browser) 
  → Supabase Edge Function (ai-planning-assistant)
    → Context assembled from org-scoped DB queries
      → External LLM API (org data + user prompt sent as request body)
        → LLM generates response
          → Response returned to browser
            → AI request/response logged to ai_request_logs table (planned G-13)
```

**Key privacy point:** Org data is sent to a third-party LLM API provider as part of the inference request. The LLM provider's data processing agreement governs how they handle this data.

---

## 5. Retention Periods

| Data Item | Retention Period | Storage Location | Deletion Method |
|-----------|----------------|-----------------|----------------|
| AI request logs (`ai_request_logs`) | 90 days | Supabase PostgreSQL | Automated deletion via scheduled function or pg_cron |
| LLM API request/response (at provider) | Per LLM provider's DPA | LLM vendor infrastructure | Per vendor policy |
| User-typed prompts (in browser memory) | Session only | Browser memory | Cleared on page unload |
| AI-generated shift notes (saved by user) | Until deleted by user or org | Supabase PostgreSQL | Customer-initiated delete or data export |

**Rationale for 90-day log retention:**
- Long enough for security incident investigation (AU-11)
- Short enough to minimize exposure of operational data
- Consistent with Supabase PITR retention window

---

## 6. Customer Controls

Customers have the following controls over AI data processing:

| Control | How | Where |
|---------|-----|-------|
| Disable AI features entirely | Org-level AI opt-out toggle (in progress — Gap G-12) | Organization Settings → AI Features |
| Delete AI-generated content | Delete individual handoff notes or work order notes | Standard delete UX |
| Data export | Export org data via the export feature (includes AI-saved content) | Settings → Data Export |
| Request data deletion | Email `privacy@jobline.ai` with org name | Manual — processed within 30 days |

---

## 7. Third-Party LLM Provider Requirements

Any LLM API provider used by JobLine AI must:
1. Maintain a Data Processing Agreement (DPA) with WeCr8 Solutions
2. Not use customer-submitted data to train AI models without explicit consent
3. Delete inference request data within 30 days (or such period as defined in the DPA)
4. Be included in the Supply Chain Risk Management Plan (Gap G-22)
5. Be listed in SSP Section 7 (external non-FedRAMP services)

**Current LLM provider status:** [LLM vendor name and DPA status to be confirmed — Engineering Lead to document here before FedRAMP assessment]

---

## 8. Disposal

When an organization's data is deleted (account closure or data deletion request):
1. All AI-generated content saved by that org is deleted per the standard data deletion flow
2. AI request logs for that org are deleted from `ai_request_logs` immediately
3. Deletion is confirmed and logged in `activity_logs` with event type `org_data_deleted`

---

## 9. FedRAMP Implications

For federal customers under a FedRAMP ATO:
- Federal data (CUI or organizational data) must NOT be sent to non-FedRAMP authorized LLM providers
- The AI Planning Assistant must either:
  - Use a FedRAMP-authorized AI inference service (e.g., Azure OpenAI on Azure Government), OR
  - Be disabled for that customer via the org-level opt-out (G-12)
- This is a condition of the Agency ATO and must be documented in the CIS/CRM Workbook (Gap G-25)

---

## Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | April 13, 2026 | Engineering Lead | Initial release for FedRAMP Moderate gap remediation (G-14) |
