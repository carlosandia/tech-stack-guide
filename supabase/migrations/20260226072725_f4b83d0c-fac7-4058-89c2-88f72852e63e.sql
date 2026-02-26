-- Drop a versão antiga sem p_canal para resolver ambiguidade
DROP FUNCTION IF EXISTS public.fn_metricas_atendimento(uuid, timestamptz, timestamptz);
