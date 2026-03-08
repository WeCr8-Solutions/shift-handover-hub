# PRD 13 — Help Center & Documentation Hub

## Status: In Development

## Overview
A GitHub-docs-style public help center at `/help` providing structured, searchable documentation for all JobLine.ai features. Serves as both in-app reference and SEO-indexed knowledge base.

## Goals
1. Reduce support burden by providing self-service answers to common questions
2. Improve onboarding by guiding new users through features step-by-step
3. Boost SEO with indexable, keyword-rich documentation pages
4. Maintain a single source of truth for feature documentation

## User Stories
- As a **new operator**, I want to learn how to check into a station and create handoffs so I can start my shift confidently.
- As a **supervisor**, I want to understand role permissions so I know what actions my team members can perform.
- As an **org admin**, I want setup guides for teams, stations, and ERP connectors so I can configure my organization correctly.
- As a **visitor**, I want to browse help documentation before signing up to understand the product's capabilities.

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
}
```

### Categories (10)
| Key | Label | Articles |
|-----|-------|----------|
| getting-started | Getting Started | 5 |
| dashboard | Dashboard | 3 |
| work-orders | Work Orders | 6 |
| shift-handoffs | Shift Handoffs | 4 |
| teams-orgs | Teams & Organizations | 5 |
| stations | Stations & Work Centers | 4 |
| quality | Quality Management | 4 |
| settings | Settings | 5 |
| admin | Admin Guide | 4 |
| faq | FAQ | 3 |

### Components
| Component | Purpose |
|-----------|---------|
| HelpSidebar | Collapsible category tree using Radix Collapsible |
| HelpSearch | Client-side article search with dropdown results |
| ArticleContent | Renders article sections with heading anchors |
| TableOfContents | Right-side heading nav (desktop only, xl+) |
| HelpBreadcrumb | Category → Article breadcrumb trail |

### Design
- Reuses MarketingNav/Footer for consistent public page framing
- Mobile: sidebar becomes a Sheet (slide-out drawer)
- Desktop: 3-column layout (sidebar | content | TOC)
- SEO: unique SEOHead per article with title, description, canonical URL
- Ads: AdPlacement components on index and article pages (public only)

## Content Guidelines
1. **Accuracy**: All content must reflect actual product behavior. No speculative or aspirational features.
2. **Clarity**: Write for operators with varying technical backgrounds. Avoid jargon unless defining it.
3. **Structure**: Each article has 3-5 sections. Each section has a clear heading and 2-4 sentences.
4. **Actionable**: Tell users *how* to do things, not just *what* things are.
5. **Maintenance**: Update articles when features change. Flag outdated content in code reviews.

## Future Enhancements
- Server-side article feedback storage (was this helpful?)
- Full-text search via database
- Version-specific documentation
- Video embeds for complex workflows
- AI-powered search suggestions
- Printable/PDF export of article collections
