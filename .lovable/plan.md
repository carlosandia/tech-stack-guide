

# Plano: Correcao dos Indicadores de Metas no Dashboard

## Problemas Identificados

### 1. Total de Metas nao inclui metas do tipo "equipe"
A funcao SQL `fn_relatorio_metas_dashboard` conta apenas metas do tipo `empresa` e `individual`, ignorando completamente as do tipo `equipe`. No banco existem 3 metas (empresa, equipe, individual), mas o dashboard mostra apenas 2.

### 2. Bug de double-counting no SQL
O bloco "individual" sobrescreve as variaveis `v_metas_atingidas` e `v_em_risco`, e depois o codigo re-consulta as metas empresa para somar de volta. Alem de ineficiente, o calculo da media tambem fica fragil.

### 3. Cards sem contexto
- **Total de Metas**: nao mostra quais sao as metas. O usuario ve um numero sem saber o que representa.
- **Em Risco**: criterio nao explicado (percentual < 40%). Nao ha tooltip.
- **Media Ating.**: sem explicacao de como e calculada.

### 4. Dados reais vs calculo
As 3 metas no banco tem `valor_atual = 600` e metas de 200k, 100k e 20k. Os percentuais (0.3%, 0.6%, 3%) parecem corretos com base no que foi vendido. A media atingimento de 1.7% esta incorreta pois exclui a meta de equipe do calculo.

---

## Solucao

### Alteracao 1: Corrigir funcao SQL `fn_relatorio_metas_dashboard`

Reescrever o bloco de calculo do resumo para:
- Contar TODAS as metas ativas (empresa + equipe + individual) de uma unica vez, eliminando o bug de double-counting
- Calcular media, atingidas e em_risco de forma unificada
- Adicionar campo `metas_nomes` (array com nome + metrica + percentual de cada meta) para exibir no tooltip

### Alteracao 2: Atualizar tipo TypeScript

Adicionar campo `metas_nomes` ao tipo `RelatorioMetasDashboard.resumo`:
```
metas_nomes: Array<{ nome: string; metrica: string; percentual: number }>
```

### Alteracao 3: Melhorar UI do `RelatorioMetas.tsx`

- **Total de Metas**: adicionar icone (?) com Popover listando nome e percentual de cada meta configurada
- **Em Risco**: adicionar icone (?) com tooltip explicando: "Metas com menos de 40% de atingimento no periodo"
- **Media Ating.**: adicionar (?) explicando: "Media do percentual de atingimento de todas as metas ativas"

---

## Detalhes Tecnicos

### SQL - Nova logica unificada (migration)

```sql
-- Substituir os 3 blocos (empresa, individual, recalcular) por um unico:
SELECT
  COUNT(*)::int,
  COUNT(*) FILTER (WHERE sub.percentual >= 100)::int,
  ROUND(COALESCE(AVG(sub.percentual), 0), 1),
  COUNT(*) FILTER (WHERE sub.percentual < 40 AND sub.percentual > 0)::int,
  COALESCE(json_agg(json_build_object('nome', sub.nome, 'metrica', sub.metrica, 'percentual', sub.percentual) ORDER BY sub.percentual DESC), '[]')
INTO v_total_metas, v_metas_atingidas, v_media_atingimento, v_em_risco, v_metas_nomes
FROM (
  SELECT m.nome, m.metrica,
    CASE WHEN m.valor_meta > 0
      THEN ROUND((COALESCE(mp.valor_atual, 0) / m.valor_meta) * 100, 1)
      ELSE 0
    END AS percentual
  FROM metas m
  LEFT JOIN LATERAL (
    SELECT valor_atual FROM metas_progresso WHERE meta_id = m.id ORDER BY calculado_em DESC LIMIT 1
  ) mp ON true
  WHERE m.organizacao_id = p_organizacao_id
    AND m.ativo = true AND m.deletado_em IS NULL
    AND m.data_inicio <= p_periodo_fim::date
    AND m.data_fim >= p_periodo_inicio::date
) sub;
```

E incluir `metas_nomes` no `v_resumo` JSON.

### Frontend - RelatorioMetas.tsx

Adicionar Popover com (?) nos cards "Total de Metas", "Em Risco" e "Media Ating.":
- Total de Metas: lista com nome e percentual de cada meta
- Em Risco: texto explicativo do criterio
- Media Ating.: texto explicativo do calculo

### Arquivos afetados
- `supabase/migrations/` - nova migration para recriar `fn_relatorio_metas_dashboard`
- `src/modules/app/types/relatorio.types.ts` - adicionar `metas_nomes`
- `src/modules/app/components/dashboard/RelatorioMetas.tsx` - tooltips e popover

