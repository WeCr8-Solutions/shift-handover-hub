# Fallow Dead-Code Snapshot — 2026-06-14

> Ran `npx fallow@latest dead-code` from project root.
> Full machine-readable output: `npx fallow dead-code --format json`.

## Summary

```
✗ 2 files · 143 exports · 130 types · 37 unused dependencies
  · 1 dev/optional dependency · 1 unlisted dependency · 2 duplicate pairs
  · 5 test-only dependencies
```

## Notable findings

### Unlisted dependency (will break in fresh installs)

- `canvas` — imported in source but missing from `package.json`.
  Add explicitly or remove the import.

### Duplicate exports (barrel ambiguity)

- `CertificateVariant` — exported from both
  `src/components/certificates/CertificateTemplate.tsx`
  and `src/hooks/useCertificateTemplates.ts`.
- `template` — exported from both
  `supabase/functions/_shared/transactional-email-templates/claim-account.tsx`
  and `concierge-finalized-pack.tsx` (different email templates, same export name).

Pick one canonical owner per export and re-export from the other.

### Unused dependencies (37)

Mostly Radix primitives. Many are imported indirectly via shadcn
components — fallow can't see those when the shadcn wrapper is in
`src/components/ui/**` (ignored in `.fallowrc.json`). Before removing
any, grep for the package name across `src/components/ui/`.

### Test-only deps in `dependencies` (should move to `devDependencies`)

- `@mdx-js/rollup`
- `@testing-library/user-event`
- `remark-frontmatter`
- `remark-mdx-frontmatter`
- `tailwindcss-animate`

`tailwindcss-animate` is actually used by Tailwind at build time —
leave it. The remark/mdx packages are used by the MDX build pipeline
and are runtime-build deps, so they may also belong where they are.
The `@testing-library/user-event` move is the only safe one.

## Action items

- [ ] Add `canvas` to `package.json` or delete the import.
- [ ] De-duplicate `CertificateVariant` and email `template` exports.
- [ ] Move `@testing-library/user-event` to `devDependencies`.
- [ ] Re-run `npx fallow dead-code` after sprint to verify count drops.

## Per-file Hooks-type cleanups (unused type exports)

Fallow flagged 130 unused type exports across 76 files. Examples:

- `src/hooks/useOapRecert.ts` — `RecertEvent`, `OperatorCredential`, `TransferToken`
- `src/hooks/useOperatorSocial.ts` — `PublicRecommendation`, `SocialCounts`, `ConnectionStatus`
- `src/hooks/useStationMachineMatrix.ts` — `StationRow`, `PurchaseRow`, `AssignmentRow`
- `src/hooks/useTalent.ts` — `SavedList`, `SavedCandidate`, `ContactRequest`

Most are public API surface intended for future consumers — leave
exported but add `// fallow-ignore-next-line unused-types` above each
to silence cleanly, or remove if truly internal.
