
# Heatmap de Pico de Atendimento por Horario e Dia da Semana

## Objetivo

Criar um grafico visual no dashboard que mostre o volume de conversas/atendimentos por **hora do dia** e **dia da semana**, permitindo ao usuario identificar rapidamente os horarios de pico para tomada de decisao (escala de equipe, campanhas, etc).

## Tipo de Grafico

**Heatmap (mapa de calor)** — e o formato mais adequado para cruzar duas dimensoes (dia x hora). Cada celula representa a quantidade de conversas naquele horario/dia, com cores variando de frio (pouco volume) a quente (alto volume). Alternativa complementar: um **BarChart** empilhado por dia mostrando distribuicao por hora.

A implementacao usara um **heatmap customizado com grid CSS** (sem dependencia extra) + um **BarChart do Recharts** (ja instalado) mostrando o total por hora do dia como visao secundaria.

## Dados Necessarios

### Nova RPC SQL: `fn_heatmap_atendimento`

Parametros:
- `p_organizacao_id` (uuid)
- `p_periodo_inicio` (timestamptz)
- `p_periodo_fim` (timestamptz)
- `p_canal` (text, opcional)

Retorno: array de objetos `{ dia_semana: 0-6, hora: 0-23, total: number }`

```sql
CREATE OR REPLACE FUNCTION fn_heatmap_atendimento(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_canal text DEFAULT NULL
)
RETURNS TABLE(dia_semana int, hora int, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    EXTRACT(DOW FROM m.criado_em)::int AS dia_semana,
    EXTRACT(HOUR FROM m.criado_em)::int AS hora,
    COUNT(*)::bigint AS total
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE c.organizacao_id = p_organizacao_id
    AND m.criado_em BETWEEN p_periodo_inicio AND p_periodo_fim
    AND c.deletado_em IS NULL
    AND m.direcao = 'inbound'
    AND (p_canal IS NULL OR c.canal = p_canal)
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;
```

## Interface Visual

```text
+----------------------------------------------------------+
| Pico de Atendimento                [Todos] [WA] [IG]     |
| Volume de conversas recebidas por horario e dia da semana |
|                                                          |
|        06  07  08  09  10  11  12  13  14  15  16  17  18|
| Seg    .   .   ##  ### ### ##  .   ##  ### ### ##  .   .  |
| Ter    .   .   ##  ### ##  ##  .   ##  ##  ### ##  .   .  |
| Qua    .   .   #   ##  ### ##  .   ##  ### ##  #   .   .  |
| Qui    .   .   ##  ### ### ### .   ### ### ### ##  .   .  |
| Sex    .   .   #   ##  ##  #   .   #   ##  ##  #   .   .  |
| Sab    .   .   .   .   .   .   .   .   .   .   .   .   .  |
| Dom    .   .   .   .   .   .   .   .   .   .   .   .   .  |
|                                                          |
| Legenda: [ branco ] [ azul claro ] [ azul ] [ azul forte]|
|                                                          |
| Horario com maior volume: Qui 10h (34 conversas)         |
+----------------------------------------------------------+
```

Cores do heatmap: escala de `bg-primary/5` (zero) ate `bg-primary` (maximo), com 5 niveis intermediarios.

## Arquivos a Criar/Modificar

| Arquivo | Acao |
|---|---|
| `supabase/migrations/...heatmap_atendimento.sql` | Nova RPC `fn_heatmap_atendimento` |
| `src/modules/app/types/relatorio.types.ts` | Adicionar tipo `HeatmapAtendimentoItem` |
| `src/modules/app/services/relatorio.service.ts` | Adicionar `fetchHeatmapAtendimento()` |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Adicionar `useHeatmapAtendimento()` |
| `src/modules/app/components/dashboard/HeatmapAtendimento.tsx` | **Novo** — Componente do heatmap |
| `src/modules/app/pages/DashboardPage.tsx` | Registrar nova secao `pico-atendimento` |
| `src/modules/app/hooks/useDashboardDisplay.ts` | Adicionar `'pico-atendimento'` ao config |

## Detalhes do Componente `HeatmapAtendimento`

- Grid CSS 8 linhas x 19 colunas (header + 7 dias, label + 18 horas 06h-23h)
- Celulas quadradas com `rounded-sm`, tooltip nativo mostrando "Seg 10h — 34 conversas"
- Legenda de cores na parte inferior
- Destaque automatico do horario de pico com label "Maior volume: Qui 10h (34 conversas)"
- Filtro por canal (badges iguais ao `MetricasAtendimento`)
- Responsivo: no mobile, scroll horizontal com `overflow-x-auto`
- Horarios fora do expediente configurado ficam com opacidade reduzida (usa `useConfigTenant`)

## Posicao no Dashboard

Sera adicionado logo **abaixo** do bloco "Indicadores de Atendimento" na ordem padrao, como secao toggleavel `pico-atendimento`.
