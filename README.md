# JobLine.ai

**Digital Expeditor & Smart Shift Handoff System for Manufacturing**

JobLine.ai replaces clipboards and paper-based processes on the production floor with real-time digital coordination. Purpose-built for CNC machine shops, aerospace, defense, and precision manufacturing teams, it streamlines shift handoffs, work order tracking, station monitoring, and team collaboration — so nothing falls through the cracks between shifts.

## Core Features

- **Real-Time Shift Handoffs** — seamless transitions with live status updates
- **Work Order Queue** — Kanban, list, and calendar views with priority management
- **Station Monitoring** — track CNC machines, lathes, and work centers in real time
- **Team Collaboration** — multi-team org structure, role-based access, QR code onboarding
- **Quality Management** — NCR tracking, scrap reporting, and inspection results
- **ERP Connector** — bidirectional sync with JobBoss, Epicor, and Plex
- **Digital Expeditor Dashboard** — replaces clipboard expeditors with real-time oversight
- **Downtime Tracking** — reason codes, trend analysis, unplanned stoppage reduction
- **Bulk Upload** — Excel template import for work orders
- **AI Planning Assistant** — AI-powered scheduling and priority recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS, Radix UI, TanStack Query |
| Backend | Supabase (PostgreSQL), Deno Edge Functions, Row-Level Security |
| Desktop | Electron (Windows installer + portable) |
| Billing | Stripe |

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd shift-handover-hub

# Install dependencies
npm i

# Start the development server
npm run dev
```

## Deployment

### Cloud (Lovable)

Open the [Lovable project](https://lovable.dev) and click **Share → Publish**.

To connect a custom domain, navigate to **Project → Settings → Domains → Connect Domain**.  
See: [Custom domain docs](https://docs.lovable.dev/features/custom-domain#custom-domain)

### Self-Hosted (ITAR-Compliant)

Set `VITE_DISABLE_ANALYTICS=true` in your environment to suppress all external telemetry.  
See `desktop/` for Electron packaging and `docs/prd/02-itar-self-hosted-deployment.md` for full guidance.

## License

Proprietary — © JobLine.ai. All rights reserved.
