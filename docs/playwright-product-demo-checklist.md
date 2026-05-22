# Playwright Product Demo Checklist

This checklist turns the product demo into a repeatable test artifact.

The demo runner now forces Playwright artifact capture for this path only: trace, screenshots, and video are always written for successful runs.

## Locked demos

- Demo 1: certificate verification and certificate action state
- Spec: `e2e/demo-cert.spec.ts`
- Script: `npm run demo:product:cert`
- Best target: live cert page that already exists on the target frontend

- Demo 2: talent profile public proof page for `@zachgoodbody`
- Spec: `e2e/demo-talent-profile.spec.ts`
- Script: `npm run demo:product:talent`
- Best target: `https://jobline.ai/talent/zachgoodbody`
- Primary still screenshot: `tmp/recordings/raw/02-talent-profile-zachgoodbody.png`

- Demo 3: dashboard station wall -> add work order -> new handoff
- Spec: `e2e/demo-dashboard-handoff.spec.ts`
- Script: `npm run demo:product:dashboard`
- Best target: `https://jobline.ai/dashboard`
- Primary still screenshot: `tmp/recordings/raw/03-dashboard-handoff-cnc-001.png`

## Environment checklist

- [ ] Decide target: `local`, `preview`, or `live`
- [ ] Confirm `E2E_BASE_URL` matches the frontend you want to show
- [ ] Confirm `E2E_SUPABASE_URL` matches the backend used by that frontend
- [ ] If using seed data, confirm `E2E_SEED_SECRET` is present
- [ ] If using a known cert directly, set `DEMO_CERT_ID`

## Recommended commands

### Lovable live with seeded cert

```powershell
$env:E2E_BASE_URL = "https://joblineai.lovable.app"
$env:E2E_SUPABASE_URL = "https://dpajcbhfwmfnzgldrveu.supabase.co"
$env:E2E_SEED_SECRET = "<seed-secret>"
$env:DEMO_PAUSE_MS = "1200"
npm run demo:product:cert
```

### Lovable live with explicit certificate id

```powershell
$env:E2E_BASE_URL = "https://joblineai.lovable.app"
$env:DEMO_CERT_ID = "<certificate-id>"
$env:DEMO_PAUSE_MS = "1200"
npm run demo:product:cert
```

### Local preview

```powershell
$env:E2E_BASE_URL = "http://127.0.0.1:4176"
$env:DEMO_CERT_ID = "<certificate-id>"
$env:DEMO_PAUSE_MS = "1200"
npm run demo:product:cert
```

### Live talent profile demo

```powershell
$env:E2E_BASE_URL = "https://jobline.ai"
$env:DEMO_TALENT_USERNAME = "zachgoodbody"
npm run demo:product:talent
```

### Live dashboard handoff demo

```powershell
$env:E2E_BASE_URL = "https://jobline.ai"
$env:DEMO_DASHBOARD_STATION = "CNC-001"
npm run demo:product:dashboard
```

## Recording checklist

- [ ] Dry-run the spec once before recording
- [ ] Confirm the verify page loads without rescue clicks
- [ ] Confirm the verified state is visible and readable
- [ ] Confirm the cert shows the correct action state: `Download PDF` for paid certs or `Unlock PDF & Print` for unpaid certs
- [ ] Confirm demo 2 writes `tmp/recordings/raw/02-talent-profile-zachgoodbody.png`
- [ ] Confirm demo 3 writes `tmp/recordings/raw/03-dashboard-handoff-cnc-001.png`
- [ ] Confirm Playwright artifacts were written to `tmp/recordings/playwright-artifacts`
- [ ] Start FocuSee after the path is proven stable
- [ ] Record camera-off first
- [ ] If needed, reset state and record a second camera-on take
- [ ] Save the artifact under `tmp/recordings/raw`

## Naming guidance

Use a filename like:

```text
YYYY-MM-DD_jobline_cert-demo_verify-download_cam-off
```

## Success criteria

- The verify page opens cleanly
- The certificate reads as valid or verified
- The cert shows the correct action state for the certificate tier
- Playwright trace, screenshots, and video are saved for the run
- The recorded path completes with no manual repair clicks
- The same command can be rerun later to regenerate the demo

## Artifact output

- Playwright trace, screenshots, and video: `tmp/recordings/playwright-artifacts`
- HTML report: `playwright-report`
- Demo 2 screenshot: `tmp/recordings/raw/02-talent-profile-zachgoodbody.png`
- Demo 3 screenshot: `tmp/recordings/raw/03-dashboard-handoff-cnc-001.png`
