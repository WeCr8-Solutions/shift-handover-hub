
# Email-Targeted Invites for Organization Members

## Problem
When trying to add a member by email, if they don't have an account yet, the system shows "They must sign up first." There's no way to reserve a spot or pre-configure their role before they sign up.

## Solution
Enhance the "Add Member" dialog to automatically create a **personal invite code** for non-existent users. This invite code will be:
- Tied to a specific email address (optional enforcement)
- Pre-configured with the selected organization role and app role
- Single-use (max_uses = 1)
- Auto-expires in 7 days
- Optionally emailed to the recipient

---

## What Will Change

### User Experience
1. Admin enters email in "Add Member" dialog
2. If user exists → added immediately (current behavior)
3. If user doesn't exist → system asks "Create invite for this email?"
4. Admin confirms → personal invite is created
5. Admin can copy invite link or send email invitation
6. When user signs up with that invite code, they get the pre-configured role

### New Behavior Summary
| User Exists? | Current | New |
|--------------|---------|-----|
| Yes | Add immediately | Same |
| No | Error: "must sign up first" | Create personal invite |

---

## Technical Changes

### 1. Database: Add `invited_email` column
Add an optional column to `organization_invites` to track email-targeted invites:

```sql
ALTER TABLE public.organization_invites
ADD COLUMN invited_email TEXT DEFAULT NULL;

-- Index for email lookups
CREATE INDEX idx_organization_invites_email 
ON public.organization_invites(invited_email) 
WHERE invited_email IS NOT NULL;
```

### 2. Update `useOrganizationMembers.ts`
Modify the `addMember` function to:
- Check if user exists
- If not, create a personal invite with `max_uses: 1`, `invited_email: email`, `expires_in: 7 days`
- Return the invite code and link to the caller

New return type:
```typescript
interface AddMemberResult {
  error?: Error;
  inviteCreated?: {
    code: string;
    link: string;
    email: string;
  };
}
```

### 3. Update `OrganizationMemberManager.tsx`
- Show a different success message when invite is created
- Display the invite code/link with copy buttons
- Add option to send email invitation (using existing email hook)
- Add "Pending Invites" section to show email-targeted invites

### 4. Update `useOrganizationInvites.ts`
- Add `invitedEmail` to the `OrganizationInvite` interface
- Update `createInvite` to accept optional `invitedEmail` parameter

### 5. Update `InviteCodeRedemption` (optional enhancement)
- If invite has `invited_email`, verify the signing-up user's email matches
- If mismatch, show warning but still allow (soft enforcement)

---

## Files to Modify

1. **Database migration** - Add `invited_email` column
2. **`src/hooks/useOrganizationMembers.ts`** - Handle invite creation for non-existent users
3. **`src/hooks/useOrganizationInvites.ts`** - Add `invitedEmail` field support
4. **`src/components/OrganizationMemberManager.tsx`** - Show invite result UI, pending invites section
5. **`src/components/InviteCodeGenerator.tsx`** - Display invited_email in table (if set)

---

## UI Flow Example

### Step 1: Enter email
```
Email Address: [john@example.com]
Organization Role: [Admin ▼]
```

### Step 2: User not found prompt
```
┌────────────────────────────────────────────────┐
│  User Not Found                                │
│                                                │
│  No account exists for john@example.com.       │
│  Would you like to create a personal invite?   │
│                                                │
│  The invite will:                              │
│  • Be reserved for this email                  │
│  • Expire in 7 days                            │
│  • Grant them Admin role when they sign up     │
│                                                │
│  [Cancel]  [Create Invite & Copy Link]         │
│            [Create Invite & Send Email]        │
└────────────────────────────────────────────────┘
```

### Step 3: Success with invite details
```
┌────────────────────────────────────────────────┐
│  ✓ Invite Created                              │
│                                                │
│  Code: X7KM9P2H                                │
│  For: john@example.com                         │
│                                                │
│  Share this link:                              │
│  [https://joblineai.lovable.app/auth?invite=...]│
│                                                │
│  [📋 Copy Code]  [🔗 Copy Link]  [✉️ Send Email]│
│                                                │
│  [Done]                                        │
└────────────────────────────────────────────────┘
```

---

## Pending Invites Table
Add a new section or tab showing email-targeted pending invites:

| Email | Role | Invite Code | Created | Expires | Actions |
|-------|------|-------------|---------|---------|---------|
| john@example.com | Admin | X7KM9P2H | Feb 6 | Feb 13 | Resend, Cancel |

---

## Security Considerations

1. **Soft email enforcement**: Don't block signup if email doesn't match (user might use different email)
2. **Rate limiting**: Max 10 personal invites per hour per admin
3. **Expiration**: Personal invites auto-expire after 7 days
4. **Single use**: Personal invites have `max_uses = 1`

---

## Success Metrics

- Reduced friction when adding new team members
- Track conversion rate from invite created → invite redeemed
- Measure time from invite to signup

