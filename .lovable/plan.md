# OAP / GCA Final Audit — Exam Mode + Certificate Gating

## What I verified is already correct

1. **Question shuffling and grading** — `shuffleChoices()` deterministically reorders choices per attempt (seeded by `questionId + startedAt`). Grader RPCs (`grade_gca_attempt`, `grade_oap_quiz_attempt`) validate against canonical keys server-side. No false answers leak.
2. **Answer keys hidden from clients** — `gca_questions.correct_answers` and `explanation` are revoked from `authenticated`; client only loads `id, prompt, choices, points, sort_order`. Same pattern for OAP.
3. **YouTube video player** — `TrainingMedia` + `InspectionToolVideoCard` + `MediaOverlayDisplay` correctly render `storage_bucket='external'` URLs as `youtube.com/embed/` iframes. Verified across GCA tool videos and OAP quiz refresher cards.
4. **Cert verification page** — `/verify/:certId` works publicly (RLS public SELECT), shows status (valid/expired/revoked), and gates printable PDF behind `isPaid`.
5. Gate the exams for payment for [jobline.ai nit just printed version making a total package for course plus cert 24.99. Exams can be used as practice and learning  but not the full exam course](http://jobline.ai)

## What is wrong (the actual bugs)

### Bug 1 — "Hints" show during graded review even in employer/paid exams

The label "Select one / Select all that apply / True or false" is fine (it's a question-type cue, not an answer hint). But after submission, **both players colorize correct/incorrect choices and reveal `explanation` text**. That's appropriate for self-study practice, but the rule is **graded employer + jobline.ai paid exams must show only the final score** — no per-question right/wrong reveal, no explanation.

### Bug 2 — Anyone can buy a $12 certificate without passing anything

- `BuyCertificateDialog` → `create-cert-checkout` → Stripe → `stripe-webhook handleCertCheckout` inserts a cert row purely from session metadata. **There is no check that the recipient ever passed an OAP quiz or GCA bank.** A visitor can land on `/oap`, click "Get my certificate — $12", pay, and receive a verifiable cert without taking a single test.
- `CertificateIssuancePanel` (org admin path) similarly issues without verifying the recipient has passing attempts on the linked role program / bank.

### Bug 3 — Self-skill free path is conflated with paid certification

Current OapHub copy ("$12 one-time · no account required") encourages random self-purchase. Per spec, self-skilling on a Talent profile (machines, tools added by the operator) must stay free, but a **real verifiable certificate** must require either:

- an **employer organization issues it** (org admin/supervisor of a paid org), OR
- the user **paid through jobline.ai AND has a passing attempt** on the linked program / bank.

---

## Plan

### 1. Add an `exam_mode` flag to both players

Add prop `mode: "practice" | "graded"` (default `"practice"`) to `GcaTestPlayer` and `QuizPlayer`. In `"graded"` mode after submit:

- Do NOT colorize correct/incorrect choices (`choiceClass` returns neutral border).
- Do NOT render `graded.explanation`.
- Do NOT render the `HandbookCite` "learn more" card.
- Show only: final score %, pass/fail badge, and a "Try again" button (still allowed because attempts are server-graded).

Pass `mode="graded"` from:

- `GcaTestPage` (the public test player at `/gca/test/:bankSlug`) — this is the certification path.
- Anywhere `QuizPlayer` is launched from inside an employer-context flow (`OapEmployerPanel`, role-program enrollment via `OapCoursePlayer` when the course belongs to an org-assigned role program).

Keep `mode="practice"` (the existing rich review with explanations) for:

- `OapCoursePlayer` when the user is self-studying without an org assignment.
- Any "study mode" preview surfaces.

### 2. Gate certificate issuance behind a real "passed" record

Add a server-side check inside `issue-certificate` and `stripe-webhook handleCertCheckout`:

- **For OAP** with `role_program_id` set: require at least one row in `oap_quiz_attempts` (joined through `oap_role_program_courses → oap_quizzes`) where `user_id = recipient` AND `passed = true` covering every required course in the role program. If `recipientEmail` does not yet map to a Supabase user (guest pre-signup), reject with a clear error: *"Sign in with the email used during your OAP attempts before purchasing the certificate."*
- **For GCA** with `bank_id` set: require at least one `gca_test_attempts` row for the recipient with `bank_id = X` AND `passed = true`.
- **For both** when no `role_program_id` / `bank_id` is provided (generic "OAP — Floor Certified"): require **either** (a) the caller is an org admin/supervisor (already enforced for free issuance) **or** (b) the recipient has at least one passed attempt on any canonical role program / bank within the last 12 months.

Implementation:

- Add a SQL helper `public.has_passed_oap_role_program(_user_id uuid, _role_program_id uuid) returns boolean` and `public.has_passed_gca_bank(_user_id uuid, _bank_id uuid) returns boolean`, both `SECURITY DEFINER set search_path = public`.
- Call these from `issue-certificate/index.ts` (admin issuance) and `stripe-webhook handleCertCheckout` (paid path) before insert. On failure, refund-friendly behavior in the webhook: **do not insert the cert**, log the rejection, and email the buyer that no passing attempt was found and how to get a refund (or take the test). Use the existing `send-email` function.

### 3. Fix the public OAP/GCA "Get certificate" CTAs

Replace the "Get my certificate — $12" buttons (OapHub, OAPLanding, GCALanding) with a two-state CTA:

- **If the signed-in user has a passing attempt on the linked program/bank** → opens `BuyCertificateDialog` (unchanged).
- **Otherwise** → opens a small "Take the test first" panel that links to `/gca/test/:bankSlug` or `/oap/courses/:slug`, with copy: *"Certificates are issued only after you pass the program. Practice and study are always free."*

Anonymous visitors get the second state (since we cannot prove a passed attempt). Keeps SEO/landing copy honest.

### 4. Tighten `BuyCertificateDialog`

- Require an authenticated user before opening (fall back to "Sign in to continue").
- Pre-fill `recipientEmail` from `user.email` and disable the field — prevents buying a cert under a different email than the one tied to the passing attempts.
- Pass `bank_id` (GCA) or `role_program_id` (OAP) into `create-cert-checkout` so the webhook can run the passed-attempt check.

### 5. Surface employer-issued vs self-issued provenance

On `/verify/:certId`, add a small badge below the cert ID:

- "Issued by **{org name}**" when `organization_id` is set,
- "Self-purchased after passing **{program/bank name}**" when no org but a linked program/bank exists,
- (No badge if neither — but step 2 makes this case impossible going forward.)

### 6. Backfill / cleanup

One-time SQL audit (read-only, reported to user, no destructive action without confirmation):

- Count existing `oap_certificates` / `gca_certificates` with no `organization_id`, no `role_program_id` / `bank_id`, and no matching passed attempt — these are the legacy "bought without passing" certs. Report the count and let the user decide whether to revoke (set `status = 'revoked'`) or grandfather them.

---

## Technical details

**Files to edit**

```text
src/components/gca/GcaTestPlayer.tsx       add `mode` prop + neutral review in graded mode
src/components/oap/QuizPlayer.tsx          add `mode` prop + neutral review in graded mode
src/pages/GcaTestPage.tsx                  pass mode="graded"
src/pages/OapCoursePlayer.tsx              compute mode from enrollment context
src/pages/OapHub.tsx                       two-state CTA + auth-gated dialog
src/pages/OAPLanding.tsx                   two-state CTA
src/pages/GCALanding.tsx                   two-state CTA
src/components/certificates/BuyCertificateDialog.tsx
                                           require auth, lock recipientEmail, forward bank_id/role_program_id
src/pages/VerifyCertificate.tsx            add provenance badge
supabase/functions/create-cert-checkout/index.ts
                                           accept role_program_id, persist in metadata
supabase/functions/issue-certificate/index.ts
                                           call has_passed_* helpers; reject on fail
supabase/functions/stripe-webhook/index.ts handleCertCheckout: call has_passed_* helpers; on fail, log + email buyer + skip insert
```

**New SQL (idempotent migration)**

```text
create or replace function public.has_passed_gca_bank(_user_id uuid, _bank_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.gca_test_attempts
    where user_id = _user_id and bank_id = _bank_id and passed = true
  );
$$;

create or replace function public.has_passed_oap_role_program(_user_id uuid, _role_program_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  with required as (
    select q.id as quiz_id
    from public.oap_role_program_courses rpc
    join public.oap_quizzes q on q.course_id = rpc.course_id
    where rpc.role_program_id = _role_program_id
  ),
  passed as (
    select distinct quiz_id from public.oap_quiz_attempts
    where user_id = _user_id and passed = true and quiz_id in (select quiz_id from required)
  )
  select (select count(*) from required) > 0
     and (select count(*) from required) = (select count(*) from passed);
$$;
```

**Stripe webhook rejection email** — new minimal HTML inviting the buyer to take the test, with a refund-request mailto.

**Backwards compatibility** — `mode` defaults to `"practice"` so existing OapCoursePlayer self-study keeps working unchanged. The grader RPCs are unchanged; only the post-submit UI varies.

---

## Out of scope (intentionally not touching)

- The `BuyCertificateDialog` "upgrade-to-printable" path stays as-is — once a cert exists (and it now requires a passed attempt), unlocking print is just a payment.
- Talent profile self-skilling (machines, tools, profile claims) — unchanged. Still free.
- Question content and bank curation — already audited in prior pass.
- PDF cert template visuals — unchanged.