# JobLine AI — Manufacturing Package Model

**Date:** 2026-04-21  
**Phase:** P3.1 Design baseline  
**Status:** Active design target for Phase 3 implementation

---

## 1. Problem Statement

The current execution model supports operation-level attachments through `setup_sheets`, but it does **not** model a controlled manufacturing package for a part or work order.

Today the system can attach a drawing, setup sheet, instruction set, or inspection plan to a routing step. That is useful for local execution, but it leaves four critical gaps:

1. There is no first-class package identity for "the released document set for this part / revision / operation set".
2. There is no completeness rule that can answer whether a traveler is execution-ready.
3. There is no approval or release state that distinguishes draft documents from production-released documents.
4. There is no stable way to reuse the same released package across multiple work orders.

For production control, especially in regulated or high-mix shops, the platform needs a package model that sits above individual attachments.

---

## 2. Current State

Current implementation characteristics:

- `setup_sheets` is the active document table used by queue and routing views.
- Each record is attached to one `routing_step_id` and one `queue_item_id`.
- `sheet_type` already distinguishes `setup_sheet`, `instruction_set`, `inspection_plan`, `drawing`, and `other`.
- Files can live in Supabase storage or as external links.
- Revision is stored per attachment, but there is no package-level revision or release lifecycle.

Current limitations:

- The same drawing uploaded across three operations becomes three unrelated rows.
- A work order cannot expose a single authoritative "document package".
- Completeness cannot be evaluated centrally.
- Package reuse across repeat jobs is manual.
- Approval, effective date, supersession, and release notes are not modeled.

---

## 3. Target Outcome

The target model is a reusable manufacturing package that answers:

- Which document package is active for this part and revision?
- Which documents are required before production can start?
- Which version of each document is released?
- Which routing steps consume which package documents?
- Is the current work order package complete, approved, and execution-ready?

---

## 4. Proposed Data Model

### 4.1 Package Header

Add a package header entity, tentatively `manufacturing_document_packages`.

Recommended fields:

- `id`
- `organization_id`
- `part_number`
- `part_revision`
- `package_code`
- `title`
- `status` with values like `draft`, `in_review`, `released`, `superseded`, `archived`
- `release_notes`
- `effective_at`
- `superseded_by_package_id`
- `created_by`
- `approved_by`
- `created_at`
- `updated_at`

Semantics:

- One package represents the released execution document set for a part + revision context.
- A package is reusable across multiple work orders.
- A work order references a package snapshot, not just loose files.

### 4.2 Package Documents

Add a package-child entity, tentatively `manufacturing_package_documents`.

Recommended fields:

- `id`
- `package_id`
- `organization_id`
- `document_type`
- `document_code`
- `title`
- `revision`
- `status` with values like `draft`, `released`, `obsolete`
- `storage_path`
- `external_link`
- `file_name`
- `mime_type`
- `checksum`
- `uploaded_by`
- `approved_by`
- `created_at`
- `updated_at`

Document types should minimally include:

- `drawing`
- `setup_sheet`
- `instruction_set`
- `inspection_plan`
- `tool_list`
- `fixture_sheet`
- `quality_record`
- `program_reference`
- `other`

### 4.3 Package Requirements

Add a rule table, tentatively `manufacturing_package_requirements`.

Recommended fields:

- `id`
- `package_id`
- `required_document_type`
- `required_min_count`
- `routing_step_id` nullable
- `operation_type` nullable
- `is_blocking`
- `notes`

Purpose:

- Defines package completeness rules.
- Allows both package-level requirements and step-specific requirements.

### 4.4 Work Order Package Assignment

Add a work-order link table, tentatively `queue_item_document_packages`.

Recommended fields:

- `id`
- `queue_item_id`
- `package_id`
- `assigned_revision`
- `assignment_mode` with values like `linked`, `snapshot`
- `assigned_at`
- `assigned_by`

Purpose:

- Makes the active package for a work order explicit.
- Supports future snapshotting if regulatory requirements need immutable release capture.

### 4.5 Routing Step Package Usage

Add a routing-usage table, tentatively `routing_step_package_documents`.

Recommended fields:

- `id`
- `routing_step_id`
- `package_document_id`
- `usage_type` with values like `required`, `optional`, `reference`
- `display_order`

Purpose:

- Connects a released package document to the step that consumes it.
- Avoids duplicating the document row for each routing step.

---

## 5. Relationship to Existing `setup_sheets`

`setup_sheets` should be treated as the migration bridge, not the long-term final model.

Recommended migration posture:

1. Preserve `setup_sheets` for existing UI continuity.
2. Introduce package tables beside it.
3. Backfill package documents from current `setup_sheets` rows.
4. Gradually change queue/routing views to read package data first.
5. Keep `setup_sheets` as a compatibility projection until all writers are migrated.

Short-term compatibility rule:

- Existing operation attachments can still render, but new released document workflows should write through the package model.

---

## 6. Completeness Rules

A package should be considered execution-ready only when:

1. Package status is `released`.
2. All blocking required document types exist.
3. Each required document is itself in `released` status.
4. The assigned package revision matches the work order revision context.
5. Step-specific required documents are linked to the corresponding routing steps.

Derived states to surface in the UI:

- `ready`
- `missing_documents`
- `draft_documents_present`
- `mismatched_revision`
- `superseded_package`

---

## 7. UI Implications

### 7.1 Queue View

Queue and station views should show:

- active package code
- package revision
- readiness badge
- missing-document count

### 7.2 Routing View

Each routing step should show:

- package documents linked to that step
- whether each linked document is required or optional
- quick open actions
- document revision and release status

### 7.3 Package Manager

Add a package management surface where supervisors or document-control roles can:

- create draft packages
- attach documents
- define required document types
- assign documents to routing steps
- release or supersede a package

---

## 8. Initial Rollout Scope

Phase 3 should be delivered in this order:

1. schema for package header, package documents, work-order assignment, and step usage
2. read-only package summary in queue/routing views
3. package completeness calculation
4. write UI for package creation and document assignment
5. compatibility migration from `setup_sheets`

---

## 9. Validation Requirements

The Phase 3 implementation is only complete when validation covers:

- package completeness for released vs draft packages
- missing required document detection
- routing step document linkage
- work-order assignment of a package
- safe rendering of storage-backed and external-link documents
- backward compatibility for legacy `setup_sheets`

---

## 10. Decision Summary

The platform should move from flat step-scoped attachments to a reusable package model with:

- package header
- package documents
- completeness rules
- explicit work-order assignment
- explicit routing-step usage links

That is the minimum model required to claim real multi-document manufacturing package support.