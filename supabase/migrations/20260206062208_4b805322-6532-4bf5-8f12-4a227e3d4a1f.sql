-- Add invited_email column for email-targeted invites
ALTER TABLE public.organization_invites
ADD COLUMN invited_email TEXT DEFAULT NULL;

-- Index for email lookups (partial index for non-null emails)
CREATE INDEX idx_organization_invites_invited_email 
ON public.organization_invites(invited_email) 
WHERE invited_email IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.organization_invites.invited_email IS 'Optional email address to target invite to a specific user. Used for personal invites when adding members by email who do not have an account yet.';