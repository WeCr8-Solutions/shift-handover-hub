# Vercel Deployment Guide

This repository is prepared for deterministic Git-based deployment on Vercel.

## Why Vercel

Vercel deploys directly from Git commits, which avoids Lovable's snapshot-publish behavior. The deployed version can be verified from `/release.json` and the in-app release badge.

## Setup

1. Import `WeCr8-Solutions/shift-handover-hub` into Vercel.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add the same required runtime environment variables used by the current app.

## Post-Deploy Verification

1. Open the deployment URL.
2. Open `/release.json` and confirm the `commitSha` matches the deployed Git commit.
3. Confirm the visible release badge in the lower-right corner shows the same short SHA.

## Routing

This repo includes [vercel.json](../../vercel.json) so client-side routes resolve to `index.html` while static assets continue to be served directly.

## Notes

- `public/release.json` is regenerated before every `dev` and `build` run.
- `src/generated/release.ts` is regenerated at the same time for the UI badge.
- If Vercel serves an older release, compare the deployment's commit SHA with `/release.json` first.