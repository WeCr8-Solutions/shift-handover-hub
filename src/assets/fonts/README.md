# Bundled Fonts — ITAR Self-Hosted Build

This directory contains locally bundled font files used when building with
`VITE_DISABLE_ANALYTICS=true` (ITAR self-hosted deployments).

In self-hosted mode the app must make **zero external network calls** outside
of `appUrl` and `supabaseUrl`. Fetching fonts from `fonts.googleapis.com` would
violate that requirement.

## Required Font Files

Download and place these files in this directory before running `npm run build`
with `VITE_DISABLE_ANALYTICS=true`:

### Inter (variable weight)
- `Inter-regular.woff2`   → Inter 400
- `Inter-medium.woff2`    → Inter 500
- `Inter-semibold.woff2`  → Inter 600
- `Inter-bold.woff2`      → Inter 700

Source: https://github.com/rsms/inter/releases/latest

### JetBrains Mono
- `JetBrainsMono-regular.woff2`   → JetBrains Mono 400
- `JetBrainsMono-medium.woff2`    → JetBrains Mono 500
- `JetBrainsMono-semibold.woff2`  → JetBrains Mono 600
- `JetBrainsMono-bold.woff2`      → JetBrains Mono 700

Source: https://github.com/JetBrains/JetBrainsMono/releases/latest

## Usage

Once font files are placed here, the `src/index.css` `@import url(...)` from
Google Fonts is automatically replaced by the local `@font-face` declarations
in `src/styles/fonts-local.css` when `VITE_DISABLE_ANALYTICS=true`.

The switchover is handled in `vite.config.ts` via `css.preprocessorOptions`.
