

# Storage Buckets Audit for Org-Scoped Operations

## Current State

| Bucket | Exists | Used By | Has RLS | Org-Scoped |
|--------|--------|---------|---------|------------|
| `performance-updates` | Yes | Job Performance Updates (image attachments) | Yes — folder-based by user_id + team membership | Partially (via team membership, not direct org_id) |
| `ncr-attachments` | **No** | NCR reports have no image/file support | N/A | N/A |
| `handoff-attachments` | **No** | Handoff records have no image/file support | N/A | N/A |

## Gaps Found

1. **NCR reports** — No `image_urls` column, no storage bucket. Aerospace-grade traceability requires photo evidence for defects (dimensional failures, surface finish issues, material defects).

2. **Handoff records** — No image attachment support. Marketing pages and PRD reference "photo attachments for machine conditions" and "setup sheets" but the feature doesn't exist in the database or UI.

3. **`performance-updates` bucket RLS** — The "team members can view" policy uses a complex self-referencing subquery on `storage.objects` that may not resolve correctly. The simpler folder-based policy works, but cross-team/supervisor visibility is fragile.

## Plan

### 1. Create two new storage buckets via migration
- `ncr-attachments` — private, 10MB limit, for NCR defect photos
- `handoff-attachments` — private, 10MB limit, for shift handoff condition photos

### 2. Add `image_urls TEXT[]` columns
- `ncr_reports.image_urls` — nullable, default `'{}'`
- `handoff_records.image_urls` — nullable, default `'{}'`

### 3. RLS policies for new buckets (org-scoped via folder path)
All buckets use `{org_id}/{user_id}/filename` folder structure:
- **INSERT**: Authenticated user must be org member, path must match `org_id/user_id`
- **SELECT**: User must be member of the org_id in the folder path
- **DELETE**: Only the uploading user (folder owner)

### 4. Harden `performance-updates` bucket RLS
Replace the fragile team-membership SELECT policy with org-scoped folder structure (`{org_id}/{user_id}/filename`) matching the new buckets, plus a migration to keep backward compatibility with existing `{user_id}/filename` paths.

### 5. Add upload/view support in hooks
- `useNCR` — add `uploadNCRImage` and `getSignedNCRImageUrls` methods
- `useStations` (handoff records) — add `uploadHandoffImage` and `getSignedHandoffImageUrls`

### 6. Update UI components
- `CreateNCRDialog` — add file upload input for defect photos
- `NewHandoffForm` — add file upload input for machine condition photos
- `NCRApprovalPanel` — display attached images with signed URLs
- `HandoffCard` — display attached images

### 7. Update `useJobPerformanceUpdates` upload path
Migrate from `{user_id}/filename` to `{org_id}/{user_id}/filename` for new uploads while keeping signed URL generation backward-compatible with old paths.

### Technical Details

**Folder structure** for all three buckets:
```text
{bucket}/
  {organization_id}/
    {user_id}/
      {timestamp}-{random}.{ext}
```

**RLS pattern** (same for all three buckets):
```sql
-- INSERT: org member, correct folder
CREATE POLICY "insert" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = '{bucket}'
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- SELECT: org member
CREATE POLICY "select" ON storage.objects FOR SELECT
USING (
  bucket_id = '{bucket}'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- DELETE: own files only
CREATE POLICY "delete" ON storage.objects FOR DELETE
USING (
  bucket_id = '{bucket}'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
```

**Migration for existing `performance-updates` data**: Old paths (`{user_id}/file`) continue to work via a fallback SELECT policy checking `is_org_member` through `organization_members` table. New uploads use the `{org_id}/{user_id}/file` structure.

