
# Filtro de Tipo de Conversa no Heatmap de Pico de Atendimento

## Objetivo

Permitir que o usuario filtre o heatmap por tipo de conversa: **Individual**, **Grupo** ou **Todos** (ambos). Isso exclui ou inclui conversas de grupo do WhatsApp na analise de pico.

## Como funciona no banco

A tabela `conversas` possui a coluna `tipo` com valores: `'individual'`, `'grupo'` e `'canal'`. A funcao SQL `fn_heatmap_atendimento` ja faz JOIN com `conversas` mas nao filtra por `tipo`.

## Alteracoes

### 1. Alterar a funcao SQL `fn_heatmap_atendimento`

Adicionar parametro `p_tipo text DEFAULT NULL` e filtro `AND (p_tipo IS NULL OR c.tipo = p_tipo)`. Manter exclusao de `tipo = 'canal'` (newsletters) quando `p_tipo` for NULL.

Nova migration:

```sql
CREATE OR REPLACE FUNCTION public.fn_heatmap_atendimento(
  p_organizacao_id uuid,
  p_periodo_inicio timestamptz,
  p_periodo_fim timestamptz,
  p_canal text DEFAULT NULL,
  p_tipo text DEFAULT NULL
)
RETURNS TABLE(dia_semana int, hora int, total bigint)
...
WHERE ...
  AND c.tipo != 'canal'
  AND (p_tipo IS NULL OR c.tipo = p_tipo)
```

### 2. Atualizar `relatorio.service.ts`

Adicionar parametro `tipo?: string` em `fetchHeatmapAtendimento` e passar como `p_tipo` no RPC.

### 3. Atualizar hook `useHeatmapAtendimento`

Adicionar parametro `tipo` na queryKey e na chamada do service.

### 4. Atualizar `HeatmapAtendimento.tsx`

Adicionar um segundo grupo de botoes (pills) para filtrar por tipo:
- **Todos** (default) - mostra individual + grupo
- **Individual** - apenas conversas individuais
- **Grupo** - apenas conversas de grupo

Layout: os botoes de tipo ficam ao lado dos botoes de canal existentes (Todos/WhatsApp/Instagram), separados por um divisor sutil.

### 5. Atualizar tipos Supabase

Adicionar `p_tipo` nos Args de `fn_heatmap_atendimento` em `types.ts`.

## Arquivos Modificados

1. **Nova migration SQL** - adiciona `p_tipo` a funcao
2. **`src/modules/app/services/relatorio.service.ts`** - parametro `tipo`
3. **`src/modules/app/hooks/useRelatorioFunil.ts`** - parametro `tipo` no hook
4. **`src/modules/app/components/dashboard/HeatmapAtendimento.tsx`** - filtro de pills
5. **`src/integrations/supabase/types.ts`** - tipo atualizado

## Resultado

O usuario tera controle granular para analisar picos de atendimento separando conversas individuais de grupos, mantendo a interface limpa com pills de filtro consistentes com o design atual.
