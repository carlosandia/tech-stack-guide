-- Habilitar extensões necessárias para cron job
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Agendar execução do processar-sla a cada minuto
SELECT cron.schedule(
  'processar-sla-rodizio',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/processar-sla',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);