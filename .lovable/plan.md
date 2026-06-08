
## Goal

Return Aymar Engineering (and the rest of the app) to working Lovable Emails on the existing `notify.wecr8.info` sender domain. Nothing in code needs to change — the infrastructure (queue, `send-transactional-email`, `auth-email-hook`, templates) is already wired up. The only blocker is DNS: the subdomain delegation drifted at the `wecr8.info` registrar, so Lovable can no longer manage SPF/DKIM/MX for it.

## What "drifted" means here

When Lovable Emails was first set up, two NS records were added at the `wecr8.info` DNS host pointing the `notify` subdomain at Lovable:

```text
notify.wecr8.info.   NS   ns3.lovable.cloud.
notify.wecr8.info.   NS   ns4.lovable.cloud.
```

Those records are no longer present (or one was removed / replaced), so Lovable can't serve the SPF, DKIM, DMARC, and MX records it manages inside that delegated zone. Until both NS records are back, every email — invites, auth, app notifications — will sit in the queue and fail.

This is the only thing broken. The Cloud → Emails page still shows the domain, the queue worker (`process-email-queue`) is healthy, and templates are deployed.

## Plan

### Step 1 — Restore the two NS records (user action, at the registrar)

This must happen at whatever DNS provider hosts `wecr8.info` (likely the registrar where the domain was purchased). I cannot push DNS changes from inside the app.

1. Log in to the DNS host for `wecr8.info`.
2. Open the DNS / zone editor for that domain.
3. Delete any conflicting records on the exact host `notify` (A, AAAA, CNAME, MX, TXT, SPF). The `notify` host must contain only the two NS records below.
4. Add (or restore) these two records:

```text
Type: NS   Host/Name: notify   Value: ns3.lovable.cloud.   TTL: default
Type: NS   Host/Name: notify   Value: ns4.lovable.cloud.   TTL: default
```

Most registrars want the host as just `notify` (they append `.wecr8.info` automatically). If yours requires the full name, use `notify.wecr8.info`.

5. Save.

### Step 2 — Re-verify inside the app

After saving the records:

1. Open **Cloud → Emails → Manage Domains**.
2. Find `notify.wecr8.info` and click **Verify Domain**.
3. Status moves through `awaiting_dns` → `active_provisioning` → `active`. Usually minutes; can take up to 72h if the registrar is slow to publish.

While it's still `awaiting_dns`, queued emails will keep retrying automatically — no need to re-send anything by hand.

### Step 3 — Validate end-to-end (after domain shows Active)

I'll run these checks on your behalf once status is green:

1. Confirm `email_send_state` has the right `from_domain` / `sender_domain` (Lovable scaffold values, not a stale third-party host).
2. Re-trigger one invite email for Aymar (Brandon's `AYMAR-OWNER-BA01`) using the existing `send-transactional-email` function with `idempotencyKey` so it doesn't double-send.
3. Look at `email_send_log` — expect a row with `status = 'sent'` and a Mailgun `message_id`.
4. Spot-check `process-email-queue` and `auth-email-hook` logs for any 401/403 (would indicate the service-role key was rotated; the fix is one tool call to refresh the Vault secret).

### Step 4 — Hand back to customer onboarding

Once mail is flowing again:

- The three pending Aymar invites (Brandon / Jaime / Cory) will deliver automatically the next time the queue worker fires (every ~5s), because they were enqueued, not failed-out.
- I'll mark the `users_roles` onboarding checklist note to reflect "invites delivered, awaiting redemption."

## What I will NOT do

- Switch you to Resend, SendGrid, Mailgun direct, Brevo, or any other third-party provider. You were on Lovable Emails and that's still the right path.
- Delete or recreate the email queue / tables / templates. Infrastructure is fine; only DNS is broken.
- Disable Lovable Emails. Disabling does not remove the NS records and would only make things worse.

## Technical notes

- DNS delegation model: Lovable owns the zone for `notify.wecr8.info` and manages SPF/DKIM/DMARC/MX inside it. That's why we only need NS records at the registrar — never raw SPF/DKIM strings.
- The `wecr8.info` apex zone is untouched. This only affects the `notify` subdomain. Your website, root MX, and anything else on `wecr8.info` are not impacted by this change.
- If the verify keeps failing after 1–2 hours: confirm with `dig NS notify.wecr8.info @8.8.8.8` that both `ns3.lovable.cloud` and `ns4.lovable.cloud` are returned. If only one shows, the registrar saved only one record — add the second.
- If you've moved DNS to Cloudflare or a similar proxy, NS records must be added at whoever is actually authoritative for `wecr8.info` (check the apex `NS` records first).

## Open question

If you'd prefer to send from a different subdomain or a different root domain (e.g. `mail.jobline.ai` so it matches the product), say the word and I'll swap the plan to "remove the drifted domain and re-add a fresh one" instead of restoring `notify.wecr8.info`. Otherwise the above is the fastest path back.
