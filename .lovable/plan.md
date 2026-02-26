
# Plano: Corrigir Reunioes no Funil de Conversao

## Problemas Identificados

### 1. SQL conta reunioes "reagendadas" como agendadas (double-counting)
A query de `reunioes_agendadas` na funcao `fn_metricas_funil` filtra apenas por `cancelada_em IS NULL`, mas nao exclui reunioes com status `reagendada`. Quando um usuario reagenda uma reuniao, o sistema cria um NOVO registro e marca o antigo como "reagendada". Contar ambos infla o numero.

Dados reais confirmam: oportunidade `22624ad2` tem 2 registros — um com status "reagendada" (antigo) e outro "agendada" (novo). Ambos sao contados.

### 2. Taxa de conversao "—" no card R. Agendadas
A conversao `sql_para_reuniao_agendada` usa `calcularTaxa(reunioes_agendadas, sqls)`. Quando SQLs = 0 (como no cenario atual), retorna null e exibe "—". Porem, existem 3 reunioes agendadas, entao a taxa deveria usar um fallback (total_leads como denominador).

### 3. Texto "conversao" duplicado no desktop
Linhas 190-198 do FunilConversao.tsx repetem o bloco `{etapa.taxaLabel} conversão` duas vezes dentro do card desktop.

---

## Solucao

### Alteracao 1: Migration SQL — excluir "reagendada" de agendadas

Recriar `fn_metricas_funil` com filtro adicional `AND r.status != 'reagendada'` no bloco de `reunioes_agendadas`. Reunioes reagendadas ja sao contadas separadamente no campo `reunioes_reagendadas`.

```sql
-- Bloco reunioes_agendadas: adicionar
AND r.status NOT IN ('reagendada')
```

### Alteracao 2: Service — fallback de conversao para R. Agendadas

No `relatorio.service.ts`, ao calcular `sql_para_reuniao_agendada`: se `sqls` = 0, usar `total_leads` como denominador. Isso garante que a taxa de conversao sempre apareca quando existem reunioes.

```typescript
sql_para_reuniao_agendada: calcularTaxa(
  metricas.reunioes_agendadas,
  metricas.sqls > 0 ? metricas.sqls : metricas.total_leads
),
```

### Alteracao 3: FunilConversao.tsx — remover linha duplicada

Remover o bloco duplicado nas linhas 195-198 (segunda ocorrencia de `{etapa.taxaLabel} conversão`).

---

## Arquivos Afetados

1. `supabase/migrations/` — nova migration para recriar `fn_metricas_funil`
2. `src/modules/app/services/relatorio.service.ts` — fallback de conversao (linha 232)
3. `src/modules/app/components/dashboard/FunilConversao.tsx` — remover duplicata (linhas 195-198)
