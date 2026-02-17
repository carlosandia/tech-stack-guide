-- Agendar limpeza automática de emails antigos diariamente às 3h
SELECT cron.schedule(
  'limpar-emails-antigos',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/limpar-emails-antigos',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M"}'::jsonb,
      body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);