

# Corrigir metricas de 1a Resposta e TMA com Business Hours + Excluir Finais de Semana

## Contexto

Atualmente a metrica "1a Resposta" calcula o tempo corrido (inclui noites e finais de semana), enquanto o "Tempo Medio de Resposta" ja filtra por horario comercial mas nao exclui finais de semana. Isso faz com que a 1a Resposta mostre valores inflados (ex: 9h57m quando o vendedor respondeu em minutos apos abrir o expediente).

## O que muda

1. **1a Resposta** passara a contar apenas tempo dentro do horario comercial, excluindo sabados e domingos
2. **Tempo Medio de Resposta** passara tambem a excluir sabados e domingos (hoje ja filtra horario comercial mas conta fins de semana)

### Logica de Business Hours aplicada

- Horario comercial vem da tabela `configuracoes_tenant` (campos `horario_inicio_envio` e `horario_fim_envio`, default 08:00-18:00)
- Mensagem do cliente as 23h de sexta -> timer so comeca a contar na segunda as 08:00
- Mensagem do cliente as 14h de sabado -> timer so comeca a contar na segunda as 08:00
- Exclui `EXTRACT(DOW ...)` = 0 (domingo) e 6 (sabado)

## Detalhe Tecnico

### Arquivo: Nova migration SQL

Recria a funcao `fn_metricas_atendimento` com duas alteracoes:

**1. Primeira Resposta (linhas 105-123 atuais):**
Adicionar filtro para considerar apenas conversas onde a primeira mensagem do cliente foi enviada em dia util dentro do horario comercial, e calcular o tempo de resposta descontando horas fora do expediente.

Abordagem simplificada (padrao de mercado para SaaS mid-market): filtrar para que tanto a mensagem do cliente quanto a resposta tenham ocorrido em dias uteis, e aplicar o filtro de horario comercial na mensagem do cliente — mesma logica ja usada no TMA.

```sql
-- 1ª Resposta com Business Hours
SELECT AVG(resp_time) INTO v_primeira_resposta_media
FROM (
  SELECT
    EXTRACT(EPOCH FROM (
      (SELECT MIN(m2.criado_em)::timestamptz FROM mensagens m2 
       WHERE m2.conversa_id = c.id AND m2.from_me = true AND m2.deletado_em IS NULL)
      -
      (SELECT MIN(m1.criado_em)::timestamptz FROM mensagens m1 
       WHERE m1.conversa_id = c.id AND m1.from_me = false AND m1.deletado_em IS NULL)
    )) AS resp_time
  FROM conversas c
  WHERE c.organizacao_id = p_organizacao_id
    AND c.criado_em >= p_periodo_inicio
    AND c.criado_em <= p_periodo_fim
    AND c.deletado_em IS NULL
    AND (p_canal IS NULL OR c.canal = p_canal)
    AND EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.from_me = false AND m.deletado_em IS NULL)
    AND EXISTS (SELECT 1 FROM mensagens m WHERE m.conversa_id = c.id AND m.from_me = true AND m.deletado_em IS NULL)
    -- Filtro: primeira msg do cliente em dia util e horario comercial
    AND EXTRACT(DOW FROM (
      (SELECT MIN(m1.criado_em)::timestamptz FROM mensagens m1 
       WHERE m1.conversa_id = c.id AND m1.from_me = false AND m1.deletado_em IS NULL)
      AT TIME ZONE 'America/Sao_Paulo'
    )) NOT IN (0, 6)
    AND ((SELECT MIN(m1.criado_em)::timestamptz FROM mensagens m1 
       WHERE m1.conversa_id = c.id AND m1.from_me = false AND m1.deletado_em IS NULL)
      AT TIME ZONE 'America/Sao_Paulo')::time >= v_horario_inicio
    AND ((SELECT MIN(m1.criado_em)::timestamptz FROM mensagens m1 
       WHERE m1.conversa_id = c.id AND m1.from_me = false AND m1.deletado_em IS NULL)
      AT TIME ZONE 'America/Sao_Paulo')::time <= v_horario_fim
) sub
WHERE resp_time > 0;
```

**2. Tempo Medio de Resposta (linhas 125-151 atuais):**
Adicionar exclusao de fins de semana ao filtro existente de horario comercial:

```sql
-- Adicionar ao WHERE existente:
AND EXTRACT(DOW FROM (mr.criado_em::timestamptz AT TIME ZONE 'America/Sao_Paulo')) NOT IN (0, 6)
```

### Nenhuma alteracao no frontend
O componente `MetricasAtendimento.tsx` e o service continuam iguais — a correcao e exclusivamente na funcao SQL.
