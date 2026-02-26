
# Funil de Conversao por Canal de Investimento

## Objetivo

Permitir que o usuario visualize o funil de conversao filtrado por canal de investimento (Todos, Meta Ads, Google Ads, Outros), mostrando metricas e custos especificos de cada canal para analisar eficiencia individual.

## Problema Atual

O funil mostra apenas dados agregados de todos os canais. O usuario investe em Meta Ads e Google Ads separadamente mas nao consegue ver qual canal traz melhor retorno no funil completo. Sem essa visao, nao ha como decidir onde alocar mais orcamento.

## Como Funciona

Ao ter investimento cadastrado, aparecerao abas/chips no cabecalho do funil: **Todos** | **Meta Ads** | **Google Ads** | **Outros** (somente canais com investimento > 0 serao exibidos). Ao clicar em um canal:

```text
Exemplo: Usuario seleciona "Meta Ads"

Funil mostra APENAS leads vindos do canal meta_ads:
  Leads: 5 (100%)  →  MQLs: 2 (40%)  →  Ganhos: 1 (20%)

Custos calculados com investimento de Meta Ads somente:
  Investido: R$ 500,00 (somente Meta Ads)
  CPL: R$ 100,00  |  CAC: R$ 500,00  |  ROMI: 120%
```

## Alteracoes Tecnicas

### 1. Corrigir SQL `fn_metricas_funil` — Matching de canal

**Problema**: Atualmente filtra por `o.utm_source = p_canal`, mas o breakdown usa `COALESCE(NULLIF(TRIM(utm_source), ''), origem, 'direto')`. Oportunidades sem utm_source mas com `origem = 'whatsapp'` nao seriam encontradas.

**Solucao**: Alterar o filtro para usar a mesma logica derivada:

```sql
AND (p_canal IS NULL OR COALESCE(NULLIF(TRIM(o.utm_source), ''), o.origem, 'direto') = p_canal)
```

Aplicar em TODAS as subqueries da funcao (leads, mqls, sqls, reunioes, fechados, etc).

**Arquivo**: Nova migration SQL

### 2. Adicionar hook de funil por canal

**Novo hook** em `useRelatorioFunil.ts`:

```typescript
export function useRelatorioFunilPorCanal(query: FunilQuery, canal: string | null) {
  const queryComCanal = canal ? { ...query, canal } : query
  return useQuery({
    queryKey: ['relatorio-funil', queryComCanal],
    queryFn: () => fetchRelatorioFunil(queryComCanal),
    enabled: !!canal,  // so busca quando um canal especifico e selecionado
    staleTime: STALE_TIME,
  })
}
```

### 3. Atualizar `construirInvestMode` para canal especifico

No frontend service, quando `query.canal` esta presente, usar somente o investimento daquele canal:

```typescript
// Se canal = 'meta_ads', usar investimento.meta_ads como total
// Se canal = 'google_ads', usar investimento.google_ads
// Se canal = 'outros', usar investimento.outros
```

**Arquivo**: `src/modules/app/services/relatorio.service.ts`

### 4. Adicionar filtro de canal no FunilConversao

**Props adicionais**: Receber `query` do DashboardPage.

**Estado local**: `canalFiltro: string | null` (null = Todos)

**UI**: Chips/abas inline no cabecalho do funil, ao lado do badge de investimento:

```text
[Todos]  [Meta Ads: R$500]  [Google Ads: R$300]
```

- So aparecem quando `invest_mode.ativo === true`
- So aparecem canais com valor > 0
- Canal selecionado fica destacado (bg-primary)
- Ao selecionar canal, usa dados do `useRelatorioFunilPorCanal`
- Quando "Todos", usa os dados ja recebidos via prop (sem query adicional)

**Arquivo**: `src/modules/app/components/dashboard/FunilConversao.tsx`

### 5. Passar query ao FunilConversao

**Arquivo**: `src/modules/app/pages/DashboardPage.tsx`

Passar `query` como prop para que o componente possa fazer queries filtradas:

```typescript
<FunilConversao data={relatorio} query={query} />
```

## Arquivos Modificados

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/new_fix_canal_filter.sql` | Criar — Corrigir matching de canal no SQL |
| `src/modules/app/components/dashboard/FunilConversao.tsx` | Editar — Adicionar filtro por canal + query separada |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Editar — Adicionar hook por canal |
| `src/modules/app/services/relatorio.service.ts` | Editar — Invest mode por canal especifico |
| `src/modules/app/pages/DashboardPage.tsx` | Editar — Passar query ao FunilConversao |

## Resultado

O usuario consegue ver a eficiencia de cada canal de investimento de forma isolada, identificando qual traz melhor CPL, CAC e ROMI. Isso permite decisoes de alocacao de orcamento baseadas em dados reais do funil.
