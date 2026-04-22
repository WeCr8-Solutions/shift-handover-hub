# SAP Connector (Scaffold — Phase 0)

Side-by-side SAP S/4HANA / ECC integration for JobLine.ai. Mirrors the
`src/connectors/jobline/` layout so future hooks/components only depend on
this barrel — never on `@sap-cloud-sdk/*` directly.

Reference: `JobLine_SAP_Integration_Plan_1.docx` (WeCr8 Solutions, v1.0).

## Layout

```
src/connectors/sap/
├── index.ts          # Barrel — ONLY public entry point for the rest of the app
├── types.ts          # Local type contracts (mirrors SAP OData shapes)
├── client.ts         # Thin client facade — calls the `sap-sync` edge function
├── normalize.ts      # SAP → JobLine domain normalization (production order, NCR, stock)
└── README.md
```

## Hard rules (mirror `connectors/jobline`)

1. Components MUST NOT import from this directory directly. They read from hooks,
   which read from the store / edge function results.
2. This directory is the ONLY place that may import from `@sap-cloud-sdk/*`
   (Phase 2). Phase 0 ships local types only — no SDK install yet.
3. Never embed customer SAP credentials in browser code. All auth lives in the
   `sap-sync` edge function, sourced from a per-org `sap_org_configs` row
   (encrypted) or the existing `erp_connections` table (vendor='sap').

## Phase plan

- **Phase 0 (this commit)** — Directory + types + edge function stub. No SDK
  install, no DB writes. Safe to ship; nothing is wired into the UI.
- **Phase 1** — Install `@sap-cloud-sdk/{http-client,connectivity,odata-v2,odata-v4,util}@^4`
  in the edge function (Deno npm: specifiers). Wire `sap-sync` to call
  `API_PRODUCTION_ORDER_2_SRV` against the SAP sandbox at `api.sap.com`.
- **Phase 2** — Reuse `erp_connections` (`erp_vendor='sap'`) and the existing
  `useERPConnector` hook. Add SAP-specific config fields via metadata JSON.
- **Phase 3** — NCR write-back to `API_INSPECTIONLOT_SRV`.

## Why a separate connector dir?

JobBoss, the existing `jobline` relay, and SAP have different wire protocols
and lifecycles. Keeping them in sibling directories means a regression in one
SDK can never break another customer's tenant.
