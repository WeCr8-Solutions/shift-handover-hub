-- =========================================================
-- Operator social: connections, follows, recommendations
-- =========================================================

-- 1. CONNECTIONS (mutual, same-org)
CREATE TABLE public.operator_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  addressee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  shared_org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CONSTRAINT operator_connections_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT operator_connections_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_operator_connections_requester ON public.operator_connections(requester_id, status);
CREATE INDEX idx_operator_connections_addressee ON public.operator_connections(addressee_id, status);

ALTER TABLE public.operator_connections ENABLE ROW LEVEL SECURITY;

-- Read: either party
CREATE POLICY "Connection parties can read"
ON public.operator_connections FOR SELECT
TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Insert: only as requester, must share an org with addressee
CREATE POLICY "Requester can create connection in shared org"
ON public.operator_connections FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = requester_id
  AND public.is_in_same_org(auth.uid(), addressee_id)
);

-- Update: addressee can accept/decline; requester can withdraw (delete)
CREATE POLICY "Addressee can respond"
ON public.operator_connections FOR UPDATE
TO authenticated
USING (auth.uid() = addressee_id)
WITH CHECK (auth.uid() = addressee_id);

-- Delete: either party can remove the connection
CREATE POLICY "Either party can remove"
ON public.operator_connections FOR DELETE
TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Trigger: stamp shared_org_id and responded_at
CREATE OR REPLACE FUNCTION public.operator_connections_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.shared_org_id IS NULL THEN
    SELECT om1.organization_id INTO NEW.shared_org_id
    FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = NEW.requester_id AND om2.user_id = NEW.addressee_id
    LIMIT 1;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('accepted','declined') THEN
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_operator_connections_before_write
BEFORE INSERT OR UPDATE ON public.operator_connections
FOR EACH ROW EXECUTE FUNCTION public.operator_connections_before_write();

-- 2. FOLLOWS (one-way, cross-org)
CREATE TABLE public.operator_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_follows_no_self CHECK (follower_id <> followed_id),
  CONSTRAINT operator_follows_unique UNIQUE (follower_id, followed_id)
);

CREATE INDEX idx_operator_follows_follower ON public.operator_follows(follower_id);
CREATE INDEX idx_operator_follows_followed ON public.operator_follows(followed_id);

ALTER TABLE public.operator_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follower or followed can read"
ON public.operator_follows FOR SELECT
TO authenticated
USING (auth.uid() = follower_id OR auth.uid() = followed_id);

CREATE POLICY "User can follow others"
ON public.operator_follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "User can unfollow"
ON public.operator_follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- 3. RECOMMENDATIONS (written endorsements, cross-org)
CREATE TABLE public.operator_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  relationship text,                       -- e.g. "Worked together at Acme", "Supervisor"
  body text NOT NULL CHECK (length(trim(body)) BETWEEN 10 AND 2000),
  is_hidden_by_recipient boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT operator_recommendations_no_self CHECK (author_id <> recipient_id),
  CONSTRAINT operator_recommendations_unique_author_recipient UNIQUE (author_id, recipient_id)
);

CREATE INDEX idx_operator_recommendations_recipient ON public.operator_recommendations(recipient_id, is_hidden_by_recipient);
CREATE INDEX idx_operator_recommendations_author ON public.operator_recommendations(author_id);

ALTER TABLE public.operator_recommendations ENABLE ROW LEVEL SECURITY;

-- Read: author + recipient always; everyone else uses the public RPC for visible recs on public profiles
CREATE POLICY "Author and recipient can read recommendations"
ON public.operator_recommendations FOR SELECT
TO authenticated
USING (auth.uid() = author_id OR auth.uid() = recipient_id);

-- Insert: only as author
CREATE POLICY "User can write recommendations"
ON public.operator_recommendations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Update: author may edit body/relationship; recipient may toggle is_hidden_by_recipient
CREATE POLICY "Author can edit own recommendation"
ON public.operator_recommendations FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Recipient can toggle visibility"
ON public.operator_recommendations FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Delete: author can delete; recipient can also delete (remove from their profile entirely)
CREATE POLICY "Author or recipient can delete"
ON public.operator_recommendations FOR DELETE
TO authenticated
USING (auth.uid() = author_id OR auth.uid() = recipient_id);

CREATE TRIGGER trg_operator_recommendations_updated_at
BEFORE UPDATE ON public.operator_recommendations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public RPC: list visible recommendations for a public profile (anon-callable)
CREATE OR REPLACE FUNCTION public.list_public_operator_recommendations(_username text)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  author_display_name text,
  author_avatar_url text,
  author_public_username text,
  relationship text,
  body text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.author_id,
    p.display_name AS author_display_name,
    op_author.avatar_url AS author_avatar_url,
    op_author.public_username AS author_public_username,
    r.relationship,
    r.body,
    r.created_at
  FROM public.operator_recommendations r
  JOIN public.operator_profiles op_recipient ON op_recipient.user_id = r.recipient_id
  LEFT JOIN public.profiles p ON p.user_id = r.author_id
  LEFT JOIN public.operator_profiles op_author ON op_author.user_id = r.author_id
  WHERE op_recipient.public_username = lower(trim(_username))
    AND op_recipient.profile_visibility = 'public'
    AND r.is_hidden_by_recipient = false
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_public_operator_recommendations(text) TO anon, authenticated;

-- Public RPC: counts (followers, recommendations) for a public profile
CREATE OR REPLACE FUNCTION public.get_public_operator_social_counts(_username text)
RETURNS TABLE (
  follower_count bigint,
  recommendation_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT COUNT(*) FROM public.operator_follows f
       JOIN public.operator_profiles op ON op.user_id = f.followed_id
       WHERE op.public_username = lower(trim(_username))
         AND op.profile_visibility = 'public'),
    (SELECT COUNT(*) FROM public.operator_recommendations r
       JOIN public.operator_profiles op ON op.user_id = r.recipient_id
       WHERE op.public_username = lower(trim(_username))
         AND op.profile_visibility = 'public'
         AND r.is_hidden_by_recipient = false);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_operator_social_counts(text) TO anon, authenticated;