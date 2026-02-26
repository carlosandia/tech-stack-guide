-- Corrigir search_path para fn_canal_match
CREATE OR REPLACE FUNCTION public.fn_canal_match(p_utm_source text, p_origem text, p_canal text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN p_canal IS NULL THEN true
    WHEN p_canal = 'meta_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads'
      )
    WHEN p_canal = 'google_ads' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) IN (
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    WHEN p_canal = 'outros' THEN
      LOWER(COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto')) NOT IN (
        'facebook', 'fb', 'instagram', 'ig', 'meta', 'meta_ads', 'meta ads',
        'facebook_ads', 'facebook ads', 'instagram_ads', 'instagram ads',
        'google', 'google_ads', 'googleads', 'gads', 'google ads',
        'google_adwords', 'adwords', 'youtube', 'youtube_ads'
      )
    ELSE
      COALESCE(NULLIF(TRIM(p_utm_source), ''), 'direto') = p_canal
  END;
$function$;

-- Corrigir search_path para update_investimentos_marketing_atualizado_em
CREATE OR REPLACE FUNCTION public.update_investimentos_marketing_atualizado_em()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$function$;