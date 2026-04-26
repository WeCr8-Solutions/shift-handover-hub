-- Remove Zach Goodbody's unbacked JobLine credentials.
-- He has 0 passed gca_test_attempts, 0 completed oap_enrollments, and 0 oap_operator_credentials,
-- so none of these minted certs reflect actual completed JobLine.ai-approved testing.

WITH zach AS (
  SELECT user_id FROM public.operator_profiles WHERE public_username = 'zachgoodbody' LIMIT 1
)
DELETE FROM public.operator_certifications oc
USING zach
WHERE oc.user_id = zach.user_id
  AND oc.verification_source = 'jobline'
  AND oc.linked_cert_id IS NOT NULL;

DELETE FROM public.gca_certificates WHERE recipient_username = 'zachgoodbody';
DELETE FROM public.oap_certificates WHERE recipient_username = 'zachgoodbody';