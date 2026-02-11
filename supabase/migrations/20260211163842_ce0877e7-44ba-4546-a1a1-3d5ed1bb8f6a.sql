-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron job: processar eventos de automação a cada 30 segundos
SELECT cron.schedule(
  'processar-eventos-automacao',
  '*/1 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ybzhlsalbnxwkfszkloa.supabase.co/functions/v1/processar-eventos-automacao',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inliemhsc2FsYm54d2tmc3prbG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMDExNzAsImV4cCI6MjA4NTc3NzE3MH0.NyxN8T0XCpnFSF_-0grGGcvhSbwOif0qxxlC_PshA9M"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron job: resetar contadores de execuções por hora (a cada hora)
SELECT cron.schedule(
  'resetar-execucoes-hora-automacao',
  '0 * * * *',
  $$
  UPDATE public.automacoes SET execucoes_ultima_hora = 0 WHERE ativo = true AND deletado_em IS NULL;
  $$
);

-- Cron job: limpar eventos processados com mais de 7 dias (diário)
SELECT cron.schedule(
  'limpar-eventos-automacao-antigos',
  '0 3 * * *',
  $$
  DELETE FROM public.eventos_automacao WHERE processado = true AND criado_em < NOW() - INTERVAL '7 days';
  $$
);