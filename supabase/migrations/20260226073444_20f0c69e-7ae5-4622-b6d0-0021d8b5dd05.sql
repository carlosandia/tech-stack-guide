CREATE OR REPLACE FUNCTION public.fn_metricas_atendimento(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_canal text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_horario_inicio time DEFAULT '08:00';
  v_horario_fim time DEFAULT '18:00';
  v_total_conversas bigint;
  v_msgs_recebidas bigint;
  v_msgs_enviadas bigint;
  v_conversas_whatsapp bigint;
  v_conversas_instagram bigint;
  v_sem_resposta bigint;
  v_primeira_resposta_media numeric;
  v_tempo_medio_resposta numeric;
BEGIN
  -- Buscar horário comercial configurado no tenant
  SELECT
    COALESCE(ct.horario_inicio_envio, '08:00')::time,
    COALESCE(ct.horario_fim_envio, '18:00')::time
  INTO v_horario_inicio, v_horario_fim
  FROM configuracoes_tenant ct
  WHERE ct.organizacao_id = p_organizacao_id
  LIMIT 1;

  -- Total de conversas no período
  SELECT COUNT(*) INTO v_total_conversas
  FROM conversas
  WHERE organizacao_id = p_organizacao_id
    AND criado_em >= p_periodo_inicio
    AND criado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_canal IS NULL OR canal = p_canal);

  -- AIDEV-NOTE: FIX - Adicionado c.deletado_em IS NULL nos JOINs abaixo
  -- para excluir mensagens de conversas soft-deleted

  -- Mensagens recebidas (from_me=false) no período
  SELECT COUNT(*) INTO v_msgs_recebidas
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE m.organizacao_id = p_organizacao_id
    AND m.from_me = false
    AND m.criado_em >= p_periodo_inicio
    AND m.criado_em <= p_periodo_fim
    AND m.deletado_em IS NULL
    AND c.deletado_em IS NULL
    AND (p_canal IS NULL OR c.canal = p_canal);

  -- Mensagens enviadas (from_me=true) no período
  SELECT COUNT(*) INTO v_msgs_enviadas
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE m.organizacao_id = p_organizacao_id
    AND m.from_me = true
    AND m.criado_em >= p_periodo_inicio
    AND m.criado_em <= p_periodo_fim
    AND m.deletado_em IS NULL
    AND c.deletado_em IS NULL
    AND (p_canal IS NULL OR c.canal = p_canal);

  -- Conversas por canal no período
  SELECT COUNT(*) INTO v_conversas_whatsapp
  FROM conversas
  WHERE organizacao_id = p_organizacao_id
    AND canal = 'whatsapp'
    AND criado_em >= p_periodo_inicio
    AND criado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_canal IS NULL OR p_canal = 'whatsapp');

  SELECT COUNT(*) INTO v_conversas_instagram
  FROM conversas
  WHERE organizacao_id = p_organizacao_id
    AND canal = 'instagram'
    AND criado_em >= p_periodo_inicio
    AND criado_em <= p_periodo_fim
    AND deletado_em IS NULL
    AND (p_canal IS NULL OR p_canal = 'instagram');

  -- Conversas sem resposta
  SELECT COUNT(*) INTO v_sem_resposta
  FROM conversas c
  WHERE c.organizacao_id = p_organizacao_id
    AND c.criado_em >= p_periodo_inicio
    AND c.criado_em <= p_periodo_fim
    AND c.deletado_em IS NULL
    AND (p_canal IS NULL OR c.canal = p_canal)
    AND EXISTS (
      SELECT 1 FROM mensagens m
      WHERE m.conversa_id = c.id AND m.from_me = false AND m.deletado_em IS NULL
    )
    AND NOT EXISTS (
      SELECT 1 FROM mensagens m
      WHERE m.conversa_id = c.id AND m.from_me = true AND m.deletado_em IS NULL
    );

  -- Primeira resposta média (segundos)
  SELECT AVG(resp_time) INTO v_primeira_resposta_media
  FROM (
    SELECT
      EXTRACT(EPOCH FROM (
        (SELECT MIN(m2.criado_em)::timestamptz FROM mensagens m2 WHERE m2.conversa_id = c.id AND m2.from_me = true AND m2.deletado_em IS NULL)
        -
        (SELECT MIN(m1.criado_em)::timestamptz FROM mensagens m1 WHERE m1.conversa_id = c.id AND m1.from_me = false AND m1.deletado_em IS NULL)
      )) AS resp_time
    FROM conversas c
    WHERE c.organizacao_id = p_organizacao_id
      AND c.criado_em >= p_periodo_inicio
      AND c.criado_em <= p_periodo_fim
      AND c.deletado_em IS NULL
      AND (p_canal IS NULL OR c.canal = p_canal)
      AND EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.from_me = false AND m.deletado_em IS NULL)
      AND EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.from_me = true AND m.deletado_em IS NULL)
  ) sub
  WHERE resp_time > 0;

  -- Tempo médio de resposta dentro do horário comercial
  SELECT AVG(resp_time) INTO v_tempo_medio_resposta
  FROM (
    SELECT
      EXTRACT(EPOCH FROM (next_reply - mr.criado_em::timestamptz)) AS resp_time
    FROM mensagens mr
    JOIN conversas c ON c.id = mr.conversa_id
    CROSS JOIN LATERAL (
      SELECT MIN(me.criado_em)::timestamptz AS next_reply
      FROM mensagens me
      WHERE me.conversa_id = mr.conversa_id
        AND me.from_me = true
        AND me.deletado_em IS NULL
        AND me.criado_em > mr.criado_em
    ) lat
    WHERE mr.organizacao_id = p_organizacao_id
      AND mr.from_me = false
      AND mr.deletado_em IS NULL
      AND mr.criado_em >= p_periodo_inicio
      AND mr.criado_em <= p_periodo_fim
      AND lat.next_reply IS NOT NULL
      AND c.deletado_em IS NULL
      AND (p_canal IS NULL OR c.canal = p_canal)
      AND (mr.criado_em::timestamptz AT TIME ZONE 'America/Sao_Paulo')::time >= v_horario_inicio
      AND (mr.criado_em::timestamptz AT TIME ZONE 'America/Sao_Paulo')::time <= v_horario_fim
  ) sub
  WHERE resp_time > 0;

  RETURN json_build_object(
    'primeira_resposta_media_segundos', ROUND(COALESCE(v_primeira_resposta_media, 0)),
    'tempo_medio_resposta_segundos', ROUND(COALESCE(v_tempo_medio_resposta, 0)),
    'sem_resposta', v_sem_resposta,
    'total_conversas', v_total_conversas,
    'mensagens_recebidas', v_msgs_recebidas,
    'mensagens_enviadas', v_msgs_enviadas,
    'conversas_whatsapp', v_conversas_whatsapp,
    'conversas_instagram', v_conversas_instagram
  );
END;
$function$;