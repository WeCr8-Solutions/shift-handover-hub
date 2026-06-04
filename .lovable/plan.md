## Review result: `operator-profiles` storage policies

The scanner-flagged policy `op_files_public_read_user_scoped` **does not exist** in the live database. The current bucket is `public=false` and has 7 well-scoped policies:

| Policy | Cmd | Effect |
|---|---|---|
| `op_files_admin_read` | SELECT | Platform admins read anything in the bucket |
| `op_files_owner_read` | SELECT | Owner reads files under their own `{uid}/...` folder |
| `op_files_public_profile_read` | SELECT (anon+auth) | Public reads only when path is `{uid}/public/...` or `{uid}/gallery/...` or matches `avatar*`/`banner*`, **and** the profile is `visibility='public' + is_discoverable + public_published_at IS NOT NULL` |
| `op_files_public_resume_read` | SELECT (anon+auth) | Public resume reads only when path is `{uid}/resume/...` **and** profile is public **and** `resume_public=true` |
| `op_files_user_insert` | INSERT | Owner can write only under `{uid}/...` |
| `op_files_user_update` | UPDATE | Owner can update only under `{uid}/...` |
| `op_files_user_delete` | DELETE | Owner can delete only under `{uid}/...` |

Verdict: **no permissive UUID-path-only read policy exists**, the visibility gate is enforced, and code paths (`src/lib/operatorProfileFiles.ts`, `useResumeVersions`, `useOperatorProfile`, `OperatorProfile.tsx`) all use the same `{uid}/...` convention. The scanner finding was stale and already marked fixed.

## Recommended hardening (only gap worth closing)

The bucket itself has no `file_size_limit` or `allowed_mime_types`, so a compromised or careless owner could upload arbitrary file types/sizes (e.g. executables, multi-GB blobs) inside their own folder, which then become reachable through the public-profile read policy if they drop them under `/public/`.

Add bucket-level constraints (defense in depth — RLS stays as-is):

- `file_size_limit`: **10 MB** per object (covers high-quality avatars, banners, gallery photos, PDFs).
- `allowed_mime_types`: `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`.

If a heavier resume or larger gallery image is ever needed, raise the limit explicitly later.

## What I will change (when you switch to build mode)

1. **One migration** updating `storage.buckets` for `operator-profiles` only:
   - `UPDATE storage.buckets SET file_size_limit = 10485760, allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/gif','application/pdf'] WHERE id = 'operator-profiles';`
2. **No RLS policy changes** — current policies are correct.
3. **No app code changes** — uploaders already use compatible types, but I will add a friendly client-side error message in `src/lib/operatorProfileFiles.ts` if the bucket rejects a file (size or MIME) so the user sees "File too large / unsupported type" instead of a raw Supabase error.

## Out of scope (intentionally)

- Tightening the public-path regex (current `avatar*`/`banner*` matcher is safe because the EXISTS clause still pins it to the owner's `user_id` and a published public profile).
- Adding org-scoped policies — operator profiles are user-owned, not org-owned, by design.
- Changing the resume-public flow.

Approve this plan and I'll apply the migration + the small uploader error-message tweak.