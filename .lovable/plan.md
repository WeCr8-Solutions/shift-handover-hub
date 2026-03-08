

# Help Center & Documentation Hub — Plan

## Overview

Build a GitHub-docs-style help center at `/help` with a sidebar navigation, searchable content, and role-based user guides. This will serve both as in-app documentation for authenticated users and as a public-facing SEO resource.

## Structure

```text
/help                          → Help landing (search + category cards)
/help/:category/:slug          → Individual article page

Categories:
├── getting-started/           → Onboarding, first login, setup wizard
├── dashboard/                 → Dashboard views, widgets, refresh
├── work-orders/               → Creating, routing, queue, kanban
├── shift-handoffs/            → Creating handoffs, reviewing, templates
├── teams-orgs/                → Org setup, teams, invites, roles
├── stations/                  → Work centers, check-in, machine profiles
├── quality/                   → NCRs, inspections, quantity tracking
├── settings/                  → Profile, notifications, billing, ERP
├── admin/                     → User management, oversight, analytics
└── faq/                       → Common questions, troubleshooting
```

## Page Layouts

**Help Index (`/help`)**
- Search bar (filters articles by title + tags)
- Grid of category cards with icon, title, article count
- "Popular Articles" section
- MarketingNav + MarketingFooter wrapper

**Article Page (`/help/:category/:slug`)**
- Left sidebar: collapsible category tree (like GitHub docs)
- Main content: rendered from a structured data array (title, body sections, related articles)
- Right sidebar (desktop): table of contents auto-generated from headings
- Breadcrumb navigation
- "Was this helpful?" feedback at bottom
- Previous/Next article navigation

## Content Scope (Initial ~40 articles)

Each article is a JS object with `category`, `slug`, `title`, `description`, `sections[]`, and `tags[]`. Sections contain heading + body text pairs. No markdown rendering needed — just structured JSX.

**Getting Started (5 articles):** Creating an account, joining an organization, navigating the dashboard, understanding roles, mobile access tips.

**Work Orders (6 articles):** Creating work orders, queue views (list/kanban/calendar), work order statuses, routing steps, part specs, bulk upload.

**Shift Handoffs (4 articles):** Creating a handoff, reviewing incoming handoffs, handoff templates, shift stats.

**Teams & Organizations (5 articles):** Creating an org, inviting members (QR codes), managing teams, role permissions explained, switching teams.

**Stations & Work Centers (4 articles):** Setting up stations, operator check-in, machine profiles, work center filtering.

**Quality Management (4 articles):** Filing an NCR, NCR approval workflow, quantity tracking, quality metrics dashboard.

**Settings (5 articles):** Profile settings, notification preferences, billing & subscriptions, shift configuration, ERP connector setup.

**Admin Guide (4 articles):** User management, organization oversight, activity logs, system updates.

**FAQ (3 articles):** Common errors & troubleshooting, data export, keyboard shortcuts.

## Technical Implementation

### New Files
| File | Purpose |
|------|---------|
| `src/pages/Help.tsx` | Main help index page |
| `src/pages/HelpArticle.tsx` | Individual article page with sidebar |
| `src/components/help/HelpSidebar.tsx` | Collapsible category tree navigation |
| `src/components/help/HelpSearch.tsx` | Search input with filtered results |
| `src/components/help/ArticleContent.tsx` | Article body renderer |
| `src/components/help/TableOfContents.tsx` | Right-side heading nav (desktop) |
| `src/components/help/HelpBreadcrumb.tsx` | Breadcrumb trail |
| `src/lib/helpArticles.ts` | All article data (structured objects) |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/help` and `/help/:category/:slug` routes |
| `src/components/marketing/MarketingNav.tsx` | Add "Help" link |
| `src/components/marketing/MarketingFooter.tsx` | Add "Help Center" link |

### PRD File
| File | Purpose |
|------|---------|
| `.lovable/prd/13-help-center.md` | Full PRD for the help center feature |

## Design Patterns
- Reuses `MarketingNav`, `MarketingFooter`, `SEOHead`, `AdPlacement`, `Badge`, `Card`, `Input`, `ScrollArea`, `Collapsible` components
- Sidebar uses `Collapsible` + `CollapsibleTrigger/Content` from Radix
- Search uses React `useState` filtering over the articles array
- URL-driven routing: `/help/:category/:slug` maps to article lookup
- Responsive: sidebar collapses to a sheet/drawer on mobile via `useIsMobile()`
- Each page gets `SEOHead` with unique title/description for indexing

## Implementation Order
1. Create `helpArticles.ts` data file with all categories and articles
2. Build `HelpSidebar`, `HelpSearch`, `ArticleContent`, `TableOfContents`, `HelpBreadcrumb` components
3. Create `Help.tsx` index page and `HelpArticle.tsx` article page
4. Add routes to `App.tsx` and navigation links
5. Write `.lovable/prd/13-help-center.md`

