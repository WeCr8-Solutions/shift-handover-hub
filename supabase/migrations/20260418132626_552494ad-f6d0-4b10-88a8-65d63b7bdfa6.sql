CREATE OR REPLACE FUNCTION public.validate_training_media_mime()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.media_type = 'image' AND NEW.mime_type NOT IN
    ('image/avif','image/gif','image/jpeg','image/png','image/webp','image/svg+xml') THEN
    RAISE EXCEPTION 'Unsupported image MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'audio' AND NEW.mime_type NOT IN
    ('audio/mpeg','audio/mp4','audio/x-m4a','audio/aac') THEN
    RAISE EXCEPTION 'Unsupported audio MIME: %', NEW.mime_type;
  ELSIF NEW.media_type = 'video' AND NEW.mime_type NOT IN
    ('video/mp4','video/webm','video/quicktime') THEN
    RAISE EXCEPTION 'Unsupported video MIME: %', NEW.mime_type;
  END IF;

  IF NEW.is_canonical = true AND NEW.organization_id IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical training_media rows cannot have organization_id';
  END IF;
  IF NEW.is_canonical = false AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Non-canonical training_media rows must have organization_id';
  END IF;

  RETURN NEW;
END;
$function$;