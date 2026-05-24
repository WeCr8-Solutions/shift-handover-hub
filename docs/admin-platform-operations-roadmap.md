# Admin Platform Operations Roadmap

## Document Purpose

This document defines the full admin-platform operations roadmap for JobLine.ai / Shift Handover Hub.

It is written for two audiences:

- Executive stakeholders who need a clear picture of business risk, operating maturity, sequencing, and expected outcomes.
- Product, engineering, design, compliance, finance, and support teams who need implementation detail, ownership boundaries, and a phased execution plan.

This roadmap treats the admin area as an operating system for the business, not as a simple settings page.

## Recommended Naming

- Initiative name: `Admin Platform Operations`
- Primary roadmap file: `docs/admin-platform-operations-roadmap.md`
- Optional future executive companion: `docs/admin-platform-operations-executive-brief.md`
- Optional future engineering delivery companion: `docs/admin-platform-operations-implementation-backlog.md`

## Documentation Governance Standard

This roadmap establishes a hard delivery rule for future work in this program.

### Hard Rule

Every directory touched during implementation must have both:

- A `README.md` that explains the directory purpose, what belongs in the directory, the major contents of the directory, and any important operating or architectural rules.
- A `CHANGELOG.md` that gives a quick reference of what changed in that directory and why those changes were made.

This rule applies to:

- New directories created during any phase
- Existing directories that are modified during any phase and do not already have these files
- Directories that become operationally important enough that future contributors need local context without re-reading the whole codebase

No phase should be considered complete in a touched directory if local documentation has been skipped.

### README Requirements

Each directory-level `README.md` should include, at minimum:

- Directory purpose
- What the directory owns
- What should not be placed in the directory
- Key files or subdirectories and what they do
- Important workflows, rules, dependencies, or operational notes
- How this directory fits into the admin-platform roadmap when relevant
- A note that the paired `CHANGELOG.md` is the quick-reference history for changes in that directory

### CHANGELOG Requirements

Each directory-level `CHANGELOG.md` should include, at minimum:

- Date of change
- Short title of change
- What changed
- Why it changed
- Impact or follow-up notes when relevant

The goal is fast local orientation for developers, product reviewers, support leads, and executive reviewers who need a concise record of why a directory evolved.

### Phase Execution Rule

During every implementation phase in this roadmap:

- If a team works in a directory, it must verify the local `README.md` and `CHANGELOG.md` exist.
- If either file is missing, the team must add it as part of that same work.
- If the directory changes materially, both files must be updated in the same delivery slice.
- Local documentation updates are required work, not backlog cleanup.

### Suggested Documentation Template

For every actively maintained implementation directory, use this minimum structure:

- `README.md`
  - Purpose
  - Ownership / scope
  - Contents
  - Rules / dependencies
  - Relationship to adjacent directories
  - Reference to `CHANGELOG.md`
- `CHANGELOG.md`
  - Date
  - Change summary
  - Reason for change
  - Follow-up if needed

## Executive Summary

The current admin area already contains meaningful foundations for organization settings, billing visibility, policy-change notices, organization oversight, compliance controls, and talent workflows. That is enough to move from ad hoc administration into a structured operational platform.

The next stage is to professionalize the entire admin surface into a controlled system for:

- Legal and policy operations
- Billing and subscription operations
- Email and notification operations
- Security and compliance governance
- Platform support and customer-success operations
- Talent and recruiting governance
- Executive reporting and platform health

This matters because the product is no longer only a workflow application. It is also:

- A multi-tenant SaaS platform
- A billing system with real financial state
- A policy and legal notification surface
- A recruiting and talent data platform
- A compliance-sensitive environment for manufacturing organizations

Without a disciplined admin program, the company will accumulate avoidable risk in legal acceptance tracking, billing support, customer trust, talent privacy, recruiter abuse prevention, audit evidence, and executive visibility.

## Business Outcomes

The target state should deliver the following outcomes:

- Reduce legal and compliance risk through versioned policies, acceptance evidence, and auditable notice workflows.
- Reduce billing friction by adding invoice history, payment visibility, seat auditability, and support-friendly back-office tools.
- Improve email reliability with templating, logging, suppression management, and delivery diagnostics.
- Improve customer support efficiency with org timelines, controlled overrides, support-safe impersonation, and health indicators.
- Protect candidate and employer trust with talent-governance controls, consent enforcement, and abuse workflows.
- Give executives a usable operations view of org health, revenue risk, adoption, compliance posture, and recruiting activity.

## Scope Model

The admin program should be explicitly split across three operating scopes.

### Platform Admin

Platform admins manage:

- Cross-tenant policy publication
- Global legal notice operations
- System-wide email operations and delivery health
- Org oversight and escalations
- Complimentary access, credits, and support overrides
- Compliance evidence and platform-wide audit views
- Feature flags and platform-level exceptions
- Executive-level reporting and platform health views

### Organization Admin

Organization admins manage:

- Organization profile and branding
- Billing contacts and local billing visibility
- Seats, local usage, and org-level subscription context
- Organization compliance settings within allowed guardrails
- User and team governance within their tenant
- Talent and recruiting workflows within their tenant

### End User / Customer-Facing Settings

These settings remain outside platform back-office operations:

- Personal preferences
- Notification preferences
- Personal talent profile settings
- Resume visibility and user-controlled data preferences
- User-level onboarding and experience configuration

## Current Baseline

The roadmap starts from what already exists, not from zero.

### Existing Admin and Settings Capabilities

- Admin entrypoint, role-gated tabs, scope selection, and admin navigation already exist in `src/pages/Admin.tsx`.
- Organization profile, billing email, compliance controls, SSO, and SIEM settings already exist in `src/components/settings/OrganizationSettings.tsx`.
- Billing plan visibility, seat management, usage visibility, and upgrade flows already exist in `src/components/settings/BillingSettings.tsx`.
- Policy notice drafting and send workflows already exist in `src/components/admin/PolicyNotificationsManager.tsx`.
- Policy email send logic and dedupe logging already exist in `supabase/functions/send-policy-change-notification/index.ts`.
- Platform organization oversight and complimentary access controls already exist in `src/components/admin/OrganizationOversight.tsx`.
- Talent search, candidate pipelines, outreach, and onboarding flows already exist in `src/pages/TalentSearch.tsx`.
- Public talent profile visibility and public resume exposure logic already exist in `src/pages/PublicOperatorProfile.tsx`.

### Keep / Extend / Replace Matrix

| Area | Current Baseline | Recommendation |
| --- | --- | --- |
| Admin shell and role gating | Strong baseline exists | Extend |
| Organization settings | Strong baseline exists | Extend |
| Billing plan and seat management | Good baseline exists | Extend |
| Policy announcement manager | Good operational seed exists | Extend |
| Policy email sending | Good backend seed exists | Extend |
| Organization oversight | Useful back-office baseline exists | Extend |
| Talent search and outreach | Useful product baseline exists | Extend |
| Public talent visibility controls | Useful baseline exists | Extend |
| Executive reporting | Fragmented / limited | New |
| Legal acceptance ledger | Not evident as a complete surface | New |
| Billing back-office operations | Partial | New |
| Email operations center | Partial | New |
| Support-safe impersonation and audit controls | Partial | New |
| Talent trust and safety controls | Partial | New |

## Target Information Architecture

The long-term admin information architecture should be organized into these top-level modules.

### 1. Executive Overview

Purpose:

- Give leadership a high-signal summary of platform health and risk.

Core content:

- Active organizations by tier
- Revenue-risk indicators
- Past-due and churn-risk org counts
- Policy acknowledgement rates
- Email delivery health
- Compliance posture indicators
- Talent marketplace activity and recruiter conversion signals

### 2. Organizations

Purpose:

- Manage and inspect tenant-level state.

Core content:

- Org profile and owner/admin information
- Membership summary
- Team summary
- ERP/integration status
- Org timeline and internal notes
- Org health and adoption indicators

### 3. Billing Operations

Purpose:

- Manage subscription, payment, seat, credit, and contract operations.

Core content:

- Current plan and status
- Seats and entitlements
- Invoices and receipts
- Payment method state
- Renewal / cancellation / downgrade state
- Credit / complimentary adjustments
- Enterprise contract metadata

### 4. Legal and Policy Operations

Purpose:

- Publish policies safely and track acceptance.

Core content:

- Policy version history
- Draft / review / approval / published states
- Effective dates
- Change summaries
- Notice send workflow
- Acceptance evidence
- Reporting exports

### 5. Email Operations

Purpose:

- Control system messaging as an operational channel.

Core content:

- Template library
- Message categories
- Delivery logs
- Bounce / complaint / suppression management
- Retry and queue visibility
- Send approvals and blast safeguards

### 6. Security and Compliance

Purpose:

- Manage sensitive controls and evidence.

Core content:

- MFA posture
- SSO state
- SIEM export health
- Support access logging
- Audit exports
- Role change history
- Session and device controls

### 7. Talent and Recruiting Governance

Purpose:

- Protect people data and control employer interactions.

Core content:

- Outreach consent and notification controls
- Employer messaging eligibility and rate limits
- Public profile exposure audit
- Resume visibility and retention state
- Candidate pipeline permissions
- Abuse reporting and enforcement

### 8. Platform Support and Audit

Purpose:

- Give internal teams controlled support tools.

Core content:

- Org support timeline
- Internal notes
- Controlled overrides
- Complimentary access history
- Support-safe impersonation
- Immutable action logs

### 9. Developer / Internal Tools

Purpose:

- Keep internal-only operational and debugging tools separate from business operations.

Core content:

- Feature flags
- Debug controls
- Internal issue queues
- Internal test tooling

## Program Checklist

Use this checklist as the delivery master list.

### Governance and Structure

- [ ] Lock the initiative name as `Admin Platform Operations`.
- [ ] Lock the roadmap document path under `docs/`.
- [ ] Agree on platform-admin vs org-admin responsibility boundaries.
- [ ] Define ownership across product, engineering, legal/compliance, finance, support, and leadership.
- [ ] Define the release governance model for high-risk admin changes.
- [ ] Adopt directory-level `README.md` and `CHANGELOG.md` coverage as a standing implementation rule.
- [ ] Define the minimum required content for each directory `README.md` and `CHANGELOG.md`.
- [ ] Require documentation updates in the same change set as code or schema changes for that directory.

### Legal and Policy Operations

- [ ] Add a true policy version source of truth.
- [ ] Support Terms, Privacy, Cookies, Billing Terms, and combined notices.
- [ ] Track draft, review, approved, scheduled, published, cancelled states.
- [ ] Store material-change flags and change summaries.
- [ ] Capture approver identity and timestamps.
- [ ] Create per-user policy acceptance records.
- [ ] Create org-level acceptance records where required.
- [ ] Support forced re-acceptance on material policy changes.
- [ ] Add reporting for sent, delivered, failed, and accepted notices.
- [ ] Add exportable legal evidence views.

### Billing Operations

- [ ] Expand current plan view into invoice and receipt history.
- [ ] Surface payment method status.
- [ ] Surface renewal, scheduled cancellation, and downgrade states.
- [ ] Add proration preview for seat changes and upgrades.
- [ ] Add seat-history audit visibility.
- [ ] Add billing contact history.
- [ ] Add credits and complimentary access audit tracking.
- [ ] Add failed payment and dunning workflows.
- [ ] Add tax / VAT / finance metadata support.
- [ ] Add enterprise contract metadata and internal renewal tracking.

### Email Operations

- [ ] Separate transactional, legal, recruiting, and marketing email classes.
- [ ] Add template versioning.
- [ ] Add preview and test-send workflow.
- [ ] Add bounce logs.
- [ ] Add complaint logs.
- [ ] Add suppression list management.
- [ ] Add delivery retry visibility.
- [ ] Add sender/domain health visibility.
- [ ] Add send approvals for sensitive campaigns or notices.
- [ ] Add blast-size confirmations and dry-run previews.

### Documentation Governance

- [ ] Add missing `README.md` files to any directory touched during roadmap execution.
- [ ] Add missing `CHANGELOG.md` files to any directory touched during roadmap execution.
- [ ] Update both files when a directory changes materially.
- [ ] Include purpose, scope, contents, and operating notes in each directory `README.md`.
- [ ] Include what changed and why in each directory `CHANGELOG.md`.
- [ ] Treat documentation completion as part of each phase exit criteria.

### Security and Compliance

- [ ] Add admin action audit taxonomy.
- [ ] Add support access reason capture.
- [ ] Add role-change auditability.
- [ ] Add session and device revocation controls.
- [ ] Add support-safe impersonation guardrails.
- [ ] Add evidence export for compliance reviews.
- [ ] Add posture reporting for MFA, SSO, AI enablement, and org compliance state.
- [ ] Add alerts for policy or billing states that create compliance risk.

### Platform Support and Customer Success

- [ ] Add org timeline.
- [ ] Add internal notes.
- [ ] Add health scoring or health indicators.
- [ ] Add override reason codes and expiration dates.
- [ ] Add onboarding-completion visibility.
- [ ] Add support escalation playbooks inside the admin operating model.

### Talent and Recruiting Governance

- [ ] Track candidate outreach consent and preferences.
- [ ] Add employer messaging rate limits.
- [ ] Add recruiter abuse reporting and enforcement flows.
- [ ] Add candidate visibility and public-profile audit events.
- [ ] Add resume retention and delete/export workflows.
- [ ] Add candidate-pipeline permission controls.
- [ ] Add trust and safety metrics for recruiter activity.

### Executive Reporting

- [ ] Add executive KPI definitions.
- [ ] Add org health rollups.
- [ ] Add policy notice acknowledgement rollups.
- [ ] Add payment-risk and churn-risk reporting.
- [ ] Add talent marketplace and recruiting funnel reporting.
- [ ] Add monthly operating review cadence and report definitions.

## Phased Implementation Plan

Implementation should proceed in phases based on dependency and risk, not based on which screen is easiest to build.

### Phase 0: Program Framing and Admin Architecture

#### Phase 0 Objective

Establish shared scope, ownership, taxonomy, and information architecture before adding more point features.

#### Phase 0 Deliverables

- Approved roadmap document
- Scope model for platform admin vs org admin
- Admin information architecture map
- Ownership matrix across business and delivery teams
- Delivery governance for high-risk admin changes

#### Phase 0 Implementation Tasks

- Audit current admin tabs and settings surfaces.
- Confirm which modules belong in admin vs user settings.
- Define naming conventions for legal, billing, support, and talent governance objects.
- Define admin action logging requirements before building new write paths.
- Define the directory documentation standard for `README.md` and `CHANGELOG.md` coverage.
- Identify admin-related directories that already meet the standard and those that need local documentation added.

#### Phase 0 Success Criteria

- Stakeholders agree on target admin model.
- Delivery teams have clear ownership.
- Future work can be sequenced without re-litigating scope.
- The team agrees that directory-level documentation is a hard rule for future work in this program.

### Phase 1: Current-State Baseline and Gap Closure Plan

#### Phase 1 Objective

Turn the current product state into a baseline inventory and decide what to extend first.

#### Phase 1 Deliverables

- Current-state capability inventory
- Keep / Extend / Replace assessment
- Dependency map for legal, billing, email, compliance, and talent governance

#### Phase 1 Implementation Tasks

- Map all existing admin surfaces and related backend functions.
- Identify missing data ledgers, audit trails, and support tools.
- Create a backlog aligned to the workstreams in this document.
- Inventory which touched directories already contain `README.md` and `CHANGELOG.md` files.
- Add backlog items for missing local documentation in directories that will be modified during implementation.

#### Phase 1 Success Criteria

- Team can point to one baseline for existing capabilities.
- Phase 2 work can start without duplicate discovery effort.
- The team has a clear documentation coverage map for every implementation directory likely to be touched.

### Phase 2: Legal, Billing, and Email Operations Foundation

#### Phase 2 Objective

Build the core operational controls that reduce legal, financial, and communications risk.

#### Phase 2 Deliverables

- Policy version and acceptance system
- Expanded billing back-office foundation
- Email operations foundation with safety and observability

#### Workstream A: Legal and Policy Operations

Implementation tasks:

- Add policy version entities for Terms, Privacy, Cookies, Billing Terms, and combined releases.
- Add approval-state workflow.
- Add effective-date and publish scheduling.
- Add user acceptance ledger.
- Add admin reporting for notice delivery and acknowledgement.
- Add export for legal evidence and support review.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by legal and policy operations work.

Success criteria:

- Every published policy version is auditable.
- Material changes can be traced to recipients and acceptance outcomes.
- Legal and compliance teams can export evidence without database intervention.

#### Workstream B: Billing Operations

Implementation tasks:

- Add invoice and receipt surfaces.
- Add payment-method health visibility.
- Add seat-history tracking and seat-adjustment reasoning.
- Add credits and complimentary access history.
- Add failed-payment operational workflows.
- Add finance notes or contract metadata where needed for enterprise accounts.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by billing operations work.

Success criteria:

- Support can answer common billing questions from within the product admin surface.
- Finance can audit manual adjustments.
- Customer-facing billing confusion is reduced.

#### Workstream C: Email Operations

Implementation tasks:

- Add email template library and versioning.
- Separate message classes by purpose.
- Add blast safeguards and preview/test path.
- Add bounce, complaint, suppression, and retry visibility.
- Add delivery diagnostics and send logs.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by email operations work.

Success criteria:

- Sensitive admin sends are controlled and reviewable.
- Delivery failures are visible and actionable.
- Support can diagnose why a notice or transactional email did not arrive.

### Phase 3: Security, Compliance, and Support Controls

#### Phase 3 Objective

Build the guardrails and evidence systems expected of a mature platform.

#### Phase 3 Deliverables

- Admin-grade audit system for sensitive changes
- Support-safe access model
- Compliance evidence and posture reporting

#### Phase 3 Implementation Tasks

- Add structured audit events for legal, billing, org, and support actions.
- Add impersonation request and approval workflow if impersonation is supported.
- Add support access reason capture.
- Add role-change and high-risk setting change auditing.
- Add evidence exports for policy acceptance, org compliance state, and admin actions.
- Add posture alerts for missing MFA, broken SSO, risky org states, and AI enablement conflicts.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by security, compliance, and support-control work.

#### Phase 3 Success Criteria

- Sensitive actions become reviewable after the fact.
- Support workflows do not rely on invisible backdoor actions.
- Compliance evidence can be generated without ad hoc engineering effort.

### Phase 4: Talent and Recruiting Governance

#### Phase 4 Objective

Professionalize the people-data and recruiter-interaction side of the platform.

#### Phase 4 Deliverables

- Candidate consent and visibility governance
- Recruiter trust-and-safety controls
- Resume and public-profile governance workflows

#### Phase 4 Implementation Tasks

- Add candidate outreach consent history.
- Add employer messaging rate limits and eligibility controls.
- Add recruiter abuse reporting and enforcement paths.
- Add public profile and resume access audit events where appropriate.
- Add resume delete/export/retention workflows.
- Add pipeline permission model review for org-admin and recruiting roles.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by talent-governance work.

#### Phase 4 Success Criteria

- The product has defensible controls around candidate data and employer access.
- Abuse handling is not improvised.
- Talent operations can scale without eroding trust.

### Phase 5: Platform Support and Executive Reporting

#### Phase 5 Objective

Give leadership and customer operations a coherent view of business state and customer health.

#### Phase 5 Deliverables

- Org timeline and support notes
- Health indicators and risk summaries
- Executive overview dashboard and KPI layer

#### Phase 5 Implementation Tasks

- Add org health cards.
- Add support notes and customer timeline events.
- Add override history with expiration and reason.
- Add executive KPI rollups.
- Add recurring report definitions and review cadence.
- Update or add local `README.md` and `CHANGELOG.md` files in every directory touched by support or executive-reporting work.

#### Phase 5 Success Criteria

- Leadership can assess platform health without stitching data from multiple tools.
- Support and customer-success teams can act on org risk faster.

### Phase 6: Readiness, Rollout, and Operational Maturity

#### Phase 6 Objective

Ship the new admin capabilities with operational discipline.

#### Phase 6 Deliverables

- Release checklist for each admin phase
- Runbooks for legal notices, payment failures, and support escalations
- QA matrix for sensitive workflows

#### Phase 6 Implementation Tasks

- Pilot high-risk workflows with platform admins first.
- Require finance/legal sign-off where necessary.
- Rehearse policy-change and failed-payment flows before broad release.
- Add regression tests for critical state transitions.
- Add operational runbooks and escalation paths.
- Verify directory-level `README.md` and `CHANGELOG.md` coverage for every directory changed in prior phases.

#### Phase 6 Success Criteria

- New admin capabilities are introduced without creating new hidden risk.
- High-risk workflows are repeatable and supportable.

## Workstream Detail

### Legal and Policy Operations Detail

#### Legal Operations Professional Standard

- Immutable version records
- Effective dates and publication timestamps
- Approval workflow and approver identity
- Change summaries written for end users
- Delivery and acknowledgement reporting
- User and org acceptance ledgers
- Exportable evidence for audit and disputes

#### Legal Operations Engineering Considerations

- Any policy write path must generate audit events.
- Acceptance logging must be tied to version identifiers, not to URLs alone.
- Forced re-accept flows must be deterministic and testable.
- Notice sends must be idempotent or deduplicated.

### Billing Operations Detail

#### Billing Operations Professional Standard

- Real invoice and receipt visibility
- Payment method health and status
- Seat history and proration logic visibility
- Manual adjustments with audit trails
- Renewal and cancellation timeline visibility
- Failed-payment handling with customer and support context

#### Billing Operations Engineering Considerations

- Billing state should be reconciled against source-of-truth payment systems.
- Manual overrides must be rare, reason-coded, and auditable.
- Support tooling must distinguish display state from authoritative source state.

### Email Operations Detail

#### Email Operations Professional Standard

- Template governance
- Send approval and preview steps
- Bounce and complaint handling
- Suppression and retry management
- Delivery audit history
- Separation of legal vs transactional vs recruiting vs marketing messages

#### Email Operations Engineering Considerations

- Message classes need separate operational rules.
- Provider event ingestion may be required for accurate delivery visibility.
- Blast-size checks should be enforced in the product, not only socially.

### Security and Compliance Detail

#### Security and Compliance Professional Standard

- Clear audit logs for sensitive actions
- Session and support-access controls
- Role change evidence
- Org posture reporting
- Evidence exports for legal and security reviews

#### Security and Compliance Engineering Considerations

- Avoid silent admin actions.
- Treat support impersonation as a regulated workflow.
- Capture scope, actor, target, reason, and timestamp for every sensitive action.

### Talent and Recruiting Governance Detail

#### Talent Governance Professional Standard

- Candidate consent enforcement
- Recruiter messaging safeguards
- Abuse workflows and policy enforcement
- Resume and public-profile privacy controls
- Data export and deletion support

#### Talent Governance Engineering Considerations

- Talent and recruiting data must be treated as governed user data, not as free-form CRM records.
- Public profile exposure and resume visibility should be traceable and reviewable.

## Ownership Model

The roadmap should be executed as a cross-functional program.

### Product

- Owns information architecture, prioritization, user workflow definition, and release sequencing.

### Engineering

- Owns implementation, data model changes, backend workflows, audit systems, and test coverage.

### Design

- Owns role-specific admin UX, destructive-action clarity, evidence and status visualization, and executive summary views.

### Legal / Compliance

- Owns policy review, material-change classification, evidence requirements, and compliance sign-off.

### Finance / Revenue Operations

- Owns billing exception rules, invoice expectations, contract metadata requirements, and financial workflow sign-off.

### Support / Customer Success

- Owns support runbooks, org health usage needs, escalation workflows, and support-safe tooling requirements.

### Leadership

- Owns KPI expectations, risk tolerance, and roadmap prioritization when tradeoffs arise.

## Data and Backend Planning Checklist

- [ ] Define policy version entities.
- [ ] Define policy acceptance ledger schema.
- [ ] Define billing event and adjustment audit schema.
- [ ] Define email template version and delivery event schema.
- [ ] Define support note and org timeline schema.
- [ ] Define talent-governance events and enforcement records.
- [ ] Define a unified admin audit event taxonomy.
- [ ] Define cron and reconciliation jobs needed for legal, billing, and notification workflows.
- [ ] Define source-of-truth boundaries between internal tables and external providers.

## Frontend and UX Planning Checklist

- [ ] Separate customer-facing settings from platform back office.
- [ ] Add visible approval states for high-risk workflows.
- [ ] Add export actions for evidence-heavy modules.
- [ ] Add destructive confirmations with context.
- [ ] Add audit context and history views where admins need them.
- [ ] Add executive read-only summary surfaces distinct from operational forms.
- [ ] Ensure every touched frontend directory includes a local `README.md` and `CHANGELOG.md`.

## Testing and Verification Checklist

- [ ] Test policy publish and acceptance capture.
- [ ] Test material policy change and forced re-accept.
- [ ] Test legal notice send dedupe and retry behavior.
- [ ] Test invoice and billing state visibility.
- [ ] Test seat changes and seat-history updates.
- [ ] Test complimentary access grants and reason logging.
- [ ] Test support access logging and impersonation guardrails.
- [ ] Test recruiter outreach governance and abuse-control workflows.
- [ ] Test executive KPI integrity against source data.

## Release Readiness Checklist

- [ ] Product review complete.
- [ ] Engineering review complete.
- [ ] Legal/compliance review complete where applicable.
- [ ] Finance review complete where applicable.
- [ ] Support runbooks written.
- [ ] QA rehearsal complete for high-risk workflows.
- [ ] Audit evidence verified.
- [ ] Monitoring and alerting defined.
- [ ] Every directory touched in the release has an updated `README.md` and `CHANGELOG.md`.

## Recommended Rollout Order

1. Legal acceptance ledger and evidence foundation
2. Billing back-office and invoice/payment visibility
3. Email operations safeguards and delivery observability
4. Security and support audit controls
5. Talent and recruiting governance
6. Executive reporting and org health rollups

## Immediate Next Steps

1. Review this roadmap with product, engineering, legal/compliance, finance, and support.
2. Convert each phase into epics with owners, dependencies, and target release windows.
3. Create the supporting backlog doc once the phased roadmap is approved.
4. Begin Phase 0 with a current-state inventory anchored to the existing admin codebase.

## Current Code Surfaces to Extend First

- `src/pages/Admin.tsx`
- `src/components/settings/OrganizationSettings.tsx`
- `src/components/settings/BillingSettings.tsx`
- `src/components/admin/PolicyNotificationsManager.tsx`
- `supabase/functions/send-policy-change-notification/index.ts`
- `src/components/admin/OrganizationOversight.tsx`
- `src/pages/TalentSearch.tsx`
- `src/pages/PublicOperatorProfile.tsx`
- `src/components/settings/registry.tsx`
- `src/components/admin/DevSettingsPanel.tsx`
