## Goal

Two related issues:
1. **Publishing failed** banner is showing on the Lovable publish dialog — blocking the live site from updating.
2. **/auth page** needs to be reordered so users can sign in with Google (and other SSO) **immediately at the top**, with the same Google button doubling as sign-up if no account exists. Form should fit on a mobile viewport (≈360×475) **without scrolling** to reach the primary CTAs.

---

## Part 1 — Diagnose & fix the publish failure

Recent activity shows many edits to `src/generated/release.ts`, `public/release.json`, and a chain of marketing/AdSense/UTM/Analytics changes. A publish failure is almost always a **build error** (TypeScript or Vite). Steps:

1. Run a full typecheck + production build locally via the harness to surface the actual error (TS error, missing import, broken JSX from the recent AdSense / UTM / Auth.tsx edits).
2. Inspect likely suspects from the most recent edits:
   - `src/components/AnalyticsProvider.tsx`, `src/lib/utm.ts`, `src/contexts/AuthContext.tsx`, `src/pages/Auth.tsx`, `src/pages/Start.tsx`
   - `src/components/marketing/AdPlacement.tsx`, `src/pages/BlogPost.tsx`, `src/pages/HelpArticle.tsx`
   - The most recent migration `supabase/migrations/20260504144838_*.sql` (idempotency + RLS)
3. Fix whatever the build surfaces (typically: a stray import, a duplicate identifier, or a broken JSX fragment from a partial edit).
4. Re-run typecheck/build to confirm green, then re-publish.

If the failure is on the Lovable platform side rather than the build, the error message in DevTools network tab will tell us — I'll also check `public/release.json` integrity.

---

## Part 2 — Auth page redesign (SSO-first, no-scroll mobile)

### Current layout (problem)
Logo → Card title → **Tabs (Login | Signup)** → email field → password field → Sign In → Separator → **Continue with Google** (way below the fold on a 360×475 phone). Same on signup tab. Footer copy adds more height.

### New layout (SSO-first, single-screen on mobile)

```text
┌─────────────────────────────────┐
│   [Logo]  JobLine.ai            │
│                                 │
│   Welcome — sign in or sign up  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ G  Continue with Google   │  │  ← primary, top
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│   Continue with Apple         │  ← (optional, if enabled)
│  └───────────────────────────┘  │
│  ───────── or with email ─────── │
│  [ email ]                      │
│  [ password ]   Forgot?         │
│  ┌───────────────────────────┐  │
│  │       Sign in / up         │  │  ← single primary button
│  └───────────────────────────┘  │
│  New here? Create an account ▾  │  ← reveals name/confirm fields
└─────────────────────────────────┘
```

### Specific changes to `src/pages/Auth.tsx`

1. **SSO at the top.** Move the `Continue with Google` button (and Apple, behind a feature flag so we don't break if Apple isn't enabled in Cloud) ABOVE the email form. One copy of the button, used by both login and signup intents — `lovable.auth.signInWithOAuth("google", …)` already creates the account on first sign-in, so the same handler covers both.
2. **Collapse the Login/Signup tabs into one form.** Default state = email + password + a single primary button labeled "Continue". On submit:
   - First try `signIn(email, password)`.
   - If the error is `Invalid login credentials` AND the user has clicked a "Create account" disclosure, run `signUp(...)` instead.
   - Cleaner UX: a small "New here? Create an account" link that expands the Display Name + Confirm Password fields inline (Radix Collapsible), so existing users never see them.
3. **Compact density for mobile.**
   - Tighten card padding: `CardContent className="p-4 sm:p-6"`, `space-y-3` instead of `space-y-4`.
   - Drop the "Manufacturing Handoff System" subtitle on small screens (`hidden sm:block`).
   - Smaller logo block on small screens (`w-10 h-10 sm:w-12 sm:h-12`).
   - Remove the trailing 2-line footer copy on mobile (`hidden sm:block`).
   - Use `min-h-dvh` instead of `min-h-screen` and remove the vertical centering on small screens (`justify-start sm:justify-center pt-6 sm:pt-0`) so the top of the form is reachable without scrolling.
4. **Keep the existing forgot-password and invite-redemption sub-views** — they already work, just inherit the same compact spacing.
5. **Analytics:** keep `auth_visit` event + traffic source. Add `sso_click` event with `provider: 'google'` + `source: getTrafficSource()` on the SSO button.

### Files touched
- `src/pages/Auth.tsx` — the redesign described above.
- (No new files, no DB changes, no new dependencies.)

---

## Acceptance criteria

- Production build passes; **publish succeeds** from the Lovable dialog.
- On a 360×475 viewport, the user sees **logo + heading + Continue with Google button + email/password + primary CTA all without scrolling**.
- Clicking **Continue with Google** signs the user in, creating an account automatically if none exists, then routes through the existing onboarding/redirect logic.
- Existing email/password login still works; new users can still create email accounts via the "Create an account" disclosure.
- Forgot-password and invite-code flows still function unchanged.
