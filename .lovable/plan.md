
# Plano: Corrigir dados fantasma nos Indicadores de Atendimento

## Problema Identificado

Quando o usuario seleciona "Instagram", o dashboard mostra "Tempo Medio Resposta: 30m 0s", "Recebidas: 1" e "Enviadas: 1", mesmo sem nenhuma conversa de Instagram ativa. 

**Causa raiz:** A funcao SQL `fn_metricas_atendimento` faz JOIN entre `mensagens` e `conversas`, mas nao filtra `c.deletado_em IS NULL` nas queries de mensagens e tempo de resposta. Existe uma conversa de Instagram que foi deletada (soft-delete) em 16/02, mas suas 2 mensagens continuam sendo contadas.

## Isolamento por Organizacao (Tenant)

Analisei todas as 5 funcoes RPC do dashboard:

| Funcao | Filtra organizacao_id | Status |
|--------|----------------------|--------|
| `fn_metricas_funil` | Sim, em todas as queries | OK |
| `fn_breakdown_canal_funil` | Sim | OK |
| `fn_dashboard_metricas_gerais` | Sim, em todas as queries | OK |
| `fn_metricas_atendimento` | Sim, MAS com bug no JOIN | **Bug** |
| `fn_relatorio_metas_dashboard` | Sim, em todas as queries | OK |

O isolamento por tenant esta correto em todos os relatorios. O problema e exclusivamente a falta do filtro `c.deletado_em IS NULL` nos JOINs da funcao de atendimento.

## Solucao

### Migration SQL: Adicionar `c.deletado_em IS NULL` em 4 queries

Na funcao `fn_metricas_atendimento`, adicionar o filtro `AND c.deletado_em IS NULL` nas seguintes queries que fazem JOIN com `conversas`:

1. **Mensagens recebidas** (JOIN mensagens + conversas) - adicionar `AND c.deletado_em IS NULL`
2. **Mensagens enviadas** (JOIN mensagens + conversas) - adicionar `AND c.deletado_em IS NULL`
3. **Primeira resposta media** (subquery com conversas) - ja filtra `c.deletado_em IS NULL` na query principal, mas as subqueries internas de mensagens precisam garantir consistencia
4. **Tempo medio de resposta** (JOIN mensagens + conversas) - adicionar `AND c.deletado_em IS NULL`

### Arquivo afetado
- `supabase/migrations/` - nova migration recriando `fn_metricas_atendimento` com os filtros corrigidos

### Nenhuma alteracao no frontend
O componente `MetricasAtendimento.tsx` e o service estao corretos. O problema e exclusivamente no SQL.
