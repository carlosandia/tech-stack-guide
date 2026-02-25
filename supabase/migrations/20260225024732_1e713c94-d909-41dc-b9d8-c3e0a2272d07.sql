UPDATE config_conversions_api 
SET eventos_habilitados = '{"lead": true, "schedule": true, "mql": true, "won": true, "lost": true}'::jsonb
WHERE id = '2658727a-363b-4fa7-bcac-d31c0c6a9aa2';