DROP FUNCTION IF EXISTS public.get_public_operator_social_counts(text);

CREATE OR REPLACE FUNCTION public.get_public_operator_social_counts(_username text)
RETURNS TABLE(follower_count bigint, following_count bigint, recommendation_count bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    (SELECT COUNT(*) FROM public.operator_follows f
       JOIN public.operator_profiles op ON op.user_id = f.followed_id
       WHERE op.public_username = lower(trim(_username))
         AND op.profile_visibility = 'public'),
    (SELECT COUNT(*) FROM public.operator_follows f
       JOIN public.operator_profiles op ON op.user_id = f.follower_id
       WHERE op.public_username = lower(trim(_username))
         AND op.profile_visibility = 'public'),
    (SELECT COUNT(*) FROM public.operator_recommendations r
       JOIN public.operator_profiles op ON op.user_id = r.recipient_id
       WHERE op.public_username = lower(trim(_username))
         AND op.profile_visibility = 'public'
         AND r.is_hidden_by_recipient = false);
$function$;