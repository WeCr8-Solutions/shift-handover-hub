# Docs Directory

## Purpose

This directory holds product, platform, implementation, architecture, rollout, and operational documentation for Shift Handover Hub / JobLine.ai.

It is the primary home for:

- Roadmaps and implementation plans
- Product requirement and scope documents
- Operational checklists
- Deployment and enterprise notes
- Architecture references
- Supporting project documentation for engineering, product, support, finance, compliance, and leadership

## What Belongs Here

- Cross-cutting project documents that apply to multiple directories or teams
- Delivery roadmaps and execution plans
- Implementation checklists and rollout plans
- Architecture notes and project-phase tracking
- Executive and operational reference documents

## What Does Not Belong Here

- Source code
- Local implementation notes that only make sense inside a feature directory
- Generated reports that should live in temporary or build-output locations
- Detailed component-level documentation that belongs next to the code it describes

## Key Contents

- `admin-platform-operations-roadmap.md` — master roadmap for the admin platform operations program
- `PROJECT_PHASES.md` — broader project phase reference
- `approval/` — approval-oriented documents and related references
- `deploy/` — deployment-specific documentation
- `enterprise/` — enterprise-facing planning or enablement notes
- `integrations/` — integration-specific documentation
- `mermaid/` — diagram-oriented assets and references
- `prd/` — product requirement documents
- `campaigns/` — editorial and marketing campaign docs (see `campaigns/manufacturing-visibility-100/` for the inaugural ranking-list campaign)

## Documentation Rules

- Treat this directory as a shared operational knowledge base.
- Prefer durable documents over throwaway planning notes.
- When adding a major program document, include enough context for executives and implementers to understand why it exists.
- If a document describes active delivery work, it should make ownership, sequencing, and expected outcomes clear.
- Review `CHANGELOG.md` in this directory for a quick history of documentation changes and why they were made.

## Relationship To Other Directories

- Use `docs/` for cross-functional and cross-directory planning.
- Use local directory `README.md` and `CHANGELOG.md` files inside source directories for implementation-local guidance.
- Link back to local code directories when a document becomes too implementation-specific.

## Phase Alignment

As part of the admin-platform implementation phases, this directory acts as the top-level planning and governance surface. The detailed operational roadmap in this directory establishes the documentation rule requiring local `README.md` and `CHANGELOG.md` coverage in every directory touched during implementation.
