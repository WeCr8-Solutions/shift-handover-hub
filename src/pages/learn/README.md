# Learn Section

## Purpose

This directory owns the public learning hub under `/learn`. It is the information-first entry point for manufacturing AI education, role-based explainers, glossary content, and tutorial ecosystems that support organic search.

## What belongs here

- Public learning landing pages and route-level pages for `/learn/*`
- Shared learn hub copy and route taxonomy decisions
- Content structures that teach manufacturing AI concepts before they push people into product surfaces

## What does not belong here

- Auth-only product workflows
- Deep reusable UI components that should live under `src/components/learn`
- Generic resources pages that are not part of the learn IA

## Main routes

- `/learn` — learning hub landing page
- `/learn/glossary` — AI glossary for manufacturing
- `/learn/fundamentals` — AI fundamentals by practical manufacturing topic
- `/learn/professions` — role-based explainers by shop responsibility
- `/learn/tutorials` — tutorial clusters and named ecosystems

## Where to start

- `LearnIndex.tsx` for the landing page and top-level learn navigation
- `LearnGlossary.tsx` for glossary framing and reflection entry points
- Child directories for the first route families added during phase 1

## Content rules

- Lead with practical explanation, usefulness, and job relevance
- Keep the public copy education-first, but always include intentional bridges into relevant JobLine.ai surfaces
- Prefer topic pages when a concept needs workflow, safety, or role nuance beyond a glossary card
- Keep links readable for search visitors and internal cross-navigation
- Use tutorials and explainers to earn trust first, then guide readers toward OAP, GCA, handbook, or other platform experiences when the next step is genuinely useful

## Recent changes

- 2026-05-20: Added the first route-family structure for fundamentals, professions, and tutorials so the learn area can expand beyond a glossary-only hub.
