# PRD 13 — Help Center & Documentation Hub

## Status: In Development

## Overview
A GitHub-docs-style public help center at `/help` providing structured, searchable documentation for all JobLine.ai features. Serves as both in-app reference and SEO-indexed knowledge base. Content is written to assist users with practical, accurate guidance without exposing proprietary implementation details.

## Goals
1. Reduce support burden by providing detailed self-service answers to common questions
2. Improve onboarding by guiding new users through every feature step-by-step
3. Boost SEO with indexable, keyword-rich documentation pages (40+ articles)
4. Maintain a single source of truth for feature documentation
5. Provide role-specific guidance so each user understands their scope and capabilities

## User Stories
- As a **new operator**, I want detailed check-in, handoff, and NCR guides so I can start my shift confidently without asking my supervisor basic questions.
- As a **supervisor**, I want to understand the full permission matrix and analytics features so I can manage my team effectively.
- As an **org admin**, I want comprehensive setup guides for teams, stations, shifts, ERP connectors, and billing so I can configure my organization correctly.
- As a **visitor**, I want to browse help documentation before signing up to understand the product's capabilities and depth.

## Content Philosophy
1. **Accuracy over aspiration**: All content reflects actual product behavior. No speculative or roadmap features.
2. **Helpful without giving everything away**: Articles explain how features work and guide users through workflows, but do not expose internal architecture, database schemas, API endpoints, or security implementation details.
3. **Role-appropriate depth**: Each article explains who can use the feature and what scope they have, so users understand their boundaries.
4. **Actionable guidance**: Tell users *how* to do things with specific steps, not just *what* things are conceptually.
5. **Manufacturing context**: Use industry-appropriate language and examples (CNC, tooling, offsets, part counts) that resonate with shop floor workers.

## Architecture

### Routing
| Route | Page | Description |
|-------|------|-------------|
| `/help` | Help.tsx | Index with search, category grid, popular articles |
| `/help/:category/:slug` | HelpArticle.tsx | Article page with sidebar, TOC, prev/next nav |

### Data Model
Articles are stored as structured JS objects in `src/lib/helpArticles.ts`:
```typescript
interface HelpArticle {
  category: string;
  categoryLabel: string;
  slug: string;
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
  tags: string[];
  relatedSlugs?: string[];
}
```

### Categories (10) — Expanded Content
| Key | Label | Articles | Sections/Article | Focus |
|-----|-------|----------|------------------|-------|
| getting-started | Getting Started | 6 | 6-8 | Account, joining, onboarding wizard, roles, mobile, dashboard nav |
| dashboard | Dashboard | 4 | 5-7 | Operator view, supervisor view, refresh behavior, analytics deep dive |
| work-orders | Work Orders | 6 | 5-7 | Creation, queue views, statuses, routing, part specs, bulk upload |
| shift-handoffs | Shift Handoffs | 4 | 5-7 | Creating, reviewing, best practices, shift stats |
| teams-orgs | Teams & Organizations | 5 | 4-7 | Org creation, invites, team management, permissions, switching |
| stations | Stations & Work Centers | 4 | 5-6 | Setup, check-in, machine profiles, filtering |
| quality | Quality Management | 4 | 5-6 | NCR filing, approval workflow, quantity tracking, metrics dashboard |
| settings | Settings | 5 | 5-6 | Profile, notifications, billing, shifts, ERP connector |
| admin | Admin Guide | 4 | 5-6 | User management, oversight, activity logs, system updates |
| faq | FAQ | 4 | 5-7 | Errors, data export, shortcuts, account security |

**Total: ~46 articles, ~260 sections**

### Components
| Component | Purpose |
|-----------|---------|
| HelpSidebar | Collapsible category tree using Radix Collapsible |
| HelpSearch | Client-side article search with dropdown results |
| ArticleContent | Renders article sections with heading anchors and tag badges |
| TableOfContents | Right-side heading nav (desktop only, xl+) |
| HelpBreadcrumb | Category → Article breadcrumb trail |

### Design
- Reuses MarketingNav/Footer for consistent public page framing
- Mobile: sidebar becomes a Sheet (slide-out drawer)
- Desktop: 3-column layout (sidebar | content | TOC)
- SEO: unique SEOHead per article with title, description, canonical URL
- Ads: AdPlacement components on index and article pages (public only)
- Feedback: "Was this helpful?" thumbs up/down on each article

## Content Tone Guidelines
- **Voice**: Professional, clear, direct. Write like an experienced colleague explaining a system — not like marketing copy or a textbook.
- **Audience**: Operators, supervisors, and admins with varying technical backgrounds. Assume familiarity with manufacturing but not with software.
- **Jargon**: Use manufacturing terms freely (SFM, IPM, tool offset, work center) but avoid software engineering jargon (API, schema, middleware).
- **Examples**: Include concrete, realistic examples from CNC machining and fabrication contexts. E.g., "X-axis servo alarm 410 triggered during roughing pass" rather than "an error occurred."
- **Length**: Each section body is 2-5 sentences of focused, specific guidance. Enough to be thorough, short enough to scan.

## Per-Category Content Strategy

### Getting Started
Target: brand-new users in their first 30 minutes. Walk them through account creation → verification → onboarding wizard → understanding their role → navigating the dashboard. Assumes zero prior context.

### Dashboard
Target: users who are signed in and need to understand what they are looking at. Explains the operator view (station-centric) vs. supervisor view (team-centric), how refresh works, and how to read analytics charts.

### Work Orders
Target: supervisors creating orders and operators working on them. Covers the full lifecycle from creation through routing through shipment. Includes practical tips for bulk upload and the Kanban/Calendar views.

### Shift Handoffs
Target: operators at shift change. Heavy emphasis on best practices — what makes a good handoff note, how to flag safety issues, how to be specific. This is the feature most directly tied to production quality.

### Teams & Organizations
Target: admins setting up their org and supervisors managing teams. Explains the data isolation model, invite flow, role assignment, and team-level settings.

### Stations & Work Centers
Target: admins configuring the floor and operators using stations daily. Covers setup, check-in mechanics, machine profiles, and filtering.

### Quality Management
Target: operators filing NCRs and supervisors dispositioning them. Explains the full NCR lifecycle, quantity tracking math, and how to use the quality dashboard for continuous improvement.

### Settings
Target: all roles for profile/notifications, admins for billing/ERP/shifts. Balances breadth (all settings areas) with practical depth.

### Admin Guide
Target: org admins responsible for user management, compliance, and system health. Includes audit trail guidance for regulated industries.

### FAQ
Target: any user encountering a problem. Error messages are quoted exactly as they appear in the UI, with specific resolution steps.

## Future Enhancements
- Server-side article feedback storage (was this helpful? + optional comment)
- Full-text search via database for larger article volumes
- Version-specific documentation (tied to release versions)
- Video embeds for complex workflows (handoff creation, bulk upload)
- AI-powered search suggestions using Lovable AI
- Printable/PDF export of article collections
- Contextual help links from within the app (e.g., "?" icon on forms links to relevant article)
- Localization support for non-English manufacturing teams
