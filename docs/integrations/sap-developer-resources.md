# SAP Developer Resources (developers.sap.com)

Curated index of upstream resources used by JobLine.ai's SAP integration. All
links point to public SAP docs — no credentials required to read them. Keep
this file as the canonical reference for "where do I learn more about X" and
update it when SAP rotates a URL.

## OData service catalog

Production data we read today and the OData services that back it:

| Domain                | Service (sandbox + production)              | Notes |
|-----------------------|---------------------------------------------|-------|
| Production Orders     | `API_PRODUCTION_ORDER_2_SRV`                | Primary read source for `useUnifiedQueue` in SAP read-through orgs |
| Inspection Lots / NCR | `API_INSPECTIONLOT_SRV`                     | Phase 3 — write-back of dispositions from JobLine NCR module |
| Material Stock        | `API_MATERIAL_STOCK_SRV`                    | Optional — feeds the AI Planning Assistant material-availability checks |
| Work Centers          | `API_WORKCENTER_SRV`                        | Used to bootstrap `erp_work_center_mappings` on first connect |

Browse / try them on the SAP API Business Hub:
- https://api.sap.com/package/SAPS4HANACloud
- https://api.sap.com/api/OP_API_PRODUCTION_ORDER_2_SRV
- https://api.sap.com/api/API_INSPECTIONLOT_SRV

## Authentication

| Tenant       | Auth                          | Where it lives |
|--------------|-------------------------------|----------------|
| Sandbox      | `APIKey` header               | `SAP_SANDBOX_APIKEY` secret in Lovable Cloud |
| Production   | OAuth 2.0 client_credentials  | Per-org `erp_connections.client_id_encrypted` / `client_secret_encrypted` + `oauth_token_endpoint` |

Reference:
- https://developers.sap.com/tutorials/api-tutorial-tools.html
- https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/

## SDKs

JobLine.ai's edge function calls SAP OData directly with `fetch` to keep the
Deno bundle small. If/when we move to the official SDK, install in the edge
function only:

```ts
// supabase/functions/sap-sync/deno.json (Phase 2)
{
  "imports": {
    "@sap-cloud-sdk/http-client": "npm:@sap-cloud-sdk/http-client@^4",
    "@sap-cloud-sdk/connectivity": "npm:@sap-cloud-sdk/connectivity@^4",
    "@sap-cloud-sdk/odata-v4": "npm:@sap-cloud-sdk/odata-v4@^4"
  }
}
```

The connector directory `src/connectors/sap/` is the ONLY place that may
import from `@sap-cloud-sdk/*` — components must go through the hook layer.

## Tutorials worth bookmarking

- Build an OData consumer: https://developers.sap.com/tutorials/abap-environment-cf-trial-onboarding.html
- ITAR / Sovereign cloud overview: https://www.sap.com/products/financial-management/sovereign-cloud.html
- API rate limits & throttling: https://help.sap.com/docs/SAP_S4HANA_CLOUD/0f69f8fb28ac4bf48d2b57b9637e81fa/0eaf677c0b7e4e9a8e4f8e1f3ea2c4ed.html

## Compliance posture

JobLine.ai never persists SAP-sourced rows for ITAR-flagged organizations.
Enforcement layers, in order:

1. **DB trigger** `enforce_itar_read_through` on `erp_connections` rejects
   `erp_persistence_mode='write_through'` for orgs with
   `requires_us_person_declaration=true`.
2. **Edge function** `sap-sync` re-checks via `get_erp_persistence_mode()`
   before any `queue_items` write.
3. **Client hook** `useDataSourceMode` resolves the mode and routes the
   dashboard to the read-through path automatically.

See `mem://features/erp-connector/persistence-modes.md` for the full
read-through architecture.
