-- AIDEV-NOTE: Corrigir branch ELSE do fn_canal_match para comparação case-insensitive
CREATE OR REPLACE FUNCTION public.fn_canal_match(
  p_utm_source text,
  p_origem text,
  p_canal text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_canal IS NULL THEN true
    WHEN p_canal = 'meta_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads'
      )
    WHEN p_canal = 'google_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) IN (
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    WHEN p_canal = 'outros' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) NOT IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads',
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    ELSE
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), p_origem, 'direto')) = LOWER(p_canal)
  END;
$$;