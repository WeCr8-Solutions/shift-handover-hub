

## Developer Portal at `/dev` (dev.jobline.ai)

### Approach

Most companies (Stripe, Vercel, Supabase) host their developer docs as a section within their main app or as a subdomain pointing to the same app. Since this is a single Lovable project, the best approach is:

1. Build a `/dev` route section (like `/help` already exists) with its own layout, sidebar, and MD-style content
2. Point `dev.jobline.ai` as a custom domain that redirects to `/dev` — or handle it via a route check on the subdomain

This follows the same pattern as your existing Help Center (`/help`) but targets developers and integrators.

### Content Structure

```text
/dev                          → Developer Portal index (overview, quick links)
/dev/:category/:slug          → Individual doc article

Categories:
├── getting-started/          → Auth tokens, SDK install, quickstart
├── api/                      → REST endpoints, RPC functions, response formats
├── extensions/               → VS Code G-Code Intelligence, Machine Connect Relay
├── integrations/             → ERP connectors, MCP server, WebSocket relay, DNC
├── sdk/                      → JavaScript SDK, Electron desktop app usage
├── webhooks/                 → Event payloads, retry logic, signature verification
└── changelog/                → Developer-facing release notes, migration guides
```

### Architecture

**Data model** — reuse the same pattern as `helpArticles.ts`:

```typescript
// src/lib/devDocs.ts
interface DevDoc {
  category: string;
  categoryLabel: string;
  slug: string;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
  tags: string[];
  codeExamples?: { language: string; code: string }[];
}
```

**Key difference from Help Center**: Dev docs include syntax-highlighted code blocks, copy-to-clipboard, and tabbed language examples (TypeScript, cURL, Python).

### Components

| Component | Purpose |
|-----------|---------|
| `DevPortal.tsx` (page) | Index with search, category grid, hero |
| `DevDocArticle.tsx` (page) | Article page with sidebar + TOC |
| `DevSidebar.tsx` | Collapsible category tree (same pattern as HelpSidebar) |
| `DevCodeBlock.tsx` | Syntax-highlighted code with copy button and language tabs |
| `DevSearch.tsx` | Client-side doc search |

### VS Code Extension Section

Dedicated articles pulling real data from the published extension:
- **JobLine G-Code Intelligence** — installation, supported dialects (Fanuc, Haas, Mazak, Siemens, Heidenhain, Okuma), configuration, snippet usage, troubleshooting
- **JobLine Machine Connect** (coming soon) — relay setup, WebSocket protocol, station binding, DNC transfer configuration

### Pages & Routing

| Route | Page |
|-------|------|
| `/dev` | `DevPortal.tsx` — index with hero, search, category cards |
| `/dev/:category/:slug` | `DevDocArticle.tsx` — article with sidebar, TOC, code blocks |

### Files to Create/Edit

1. **Create** `src/lib/devDocs.ts` — all developer documentation content (structured articles covering API, extensions, integrations, SDK, changelog)
2. **Create** `src/pages/DevPortal.tsx` — index page with search, category grid, featured docs
3. **Create** `src/pages/DevDocArticle.tsx` — article renderer with sidebar, TOC, code blocks
4. **Create** `src/components/dev/DevSidebar.tsx` — collapsible category navigation
5. **Create** `src/components/dev/DevCodeBlock.tsx` — syntax-highlighted code with copy + language tabs
6. **Create** `src/components/dev/DevSearch.tsx` — client-side search across dev docs
7. **Edit** `src/App.tsx` — add `/dev` and `/dev/:category/:slug` routes
8. **Edit** `src/components/marketing/MarketingNav.tsx` — add "Developers" link under appropriate dropdown

### Domain Setup

After building, point `dev.jobline.ai` to this project via Lovable's custom domain settings. Add a route-level redirect so visitors hitting `dev.jobline.ai` land on `/dev` automatically.

### Initial Content (Phase 1)

~20 articles across 6 categories to start, expanding over time. Each article includes 4-6 sections with code examples where relevant. Extension docs will link directly to the VS Code Marketplace for installation.

