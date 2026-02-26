
# Correcao da Logica de Conversao do Funil

## Problema Atual

A conversao entre etapas esta sendo calculada como **etapa atual / etapa anterior**, o que gera valores como 300% (ex: 3 reunioes agendadas / 1 MQL = 300%). Isso nao faz sentido estrategico — um funil de conversao nunca deveria ultrapassar 100% pois representa "filtragem" de volume.

## Como os Grandes CRMs Fazem

HubSpot, Salesforce e RD Station usam o padrao de **conversao acumulada a partir do topo do funil (Leads)**:

```text
Leads:              7  (100%)
MQLs:               1  (14.3% dos Leads)
R. Agendadas:       3  (42.9% dos Leads)
R. Realizadas:      1  (14.3% dos Leads)
Ganhos:             2  (28.6% dos Leads)
```

Isso mostra a **taxa de filtragem real** do funil. Valores nunca ultrapassam 100%. Quando uma etapa intermediaria tem mais volume que a anterior (como o caso de 3 agendadas vs 1 MQL), isso indica que leads pularam etapas — o que e normal em operacoes comerciais (nem todo lead precisa ser classificado como MQL antes de agendar reuniao).

**Adicionalmente**, entre etapas adjacentes, a seta mostra a taxa etapa-a-etapa para identificar gargalos especificos, mas limitada a 100% (cap).

## Solucao Proposta

### Regra de calculo

1. **Percentual exibido no bloco**: Conversao em relacao ao **total de Leads** (topo do funil) — nunca ultrapassa 100%
2. **Seta entre etapas**: Taxa etapa-a-etapa, com **cap em 100%** — se o valor da etapa posterior for maior que a anterior, exibe 100% (indica que nao ha perda nesse ponto)
3. **Conversao geral**: Mantida como `fechados / leads` (ja existe)

### Alteracao no Frontend

Arquivo `src/modules/app/components/dashboard/FunilConversao.tsx`, linhas 136-142:

De:
```typescript
const taxa = Math.round((etapa.value / anterior.value) * 1000) / 10
```

Para:
```typescript
// Taxa relativa ao topo do funil (Leads)
const primeiraEtapa = etapasVisiveis[0]
const taxaDoTopo = primeiraEtapa.value > 0
  ? Math.round((etapa.value / primeiraEtapa.value) * 1000) / 10
  : 0
const taxaFinal = Math.min(taxaDoTopo, 100)
```

A seta entre etapas mostrara a taxa etapa-a-etapa (com cap em 100%):
```typescript
const taxaEntreEtapas = anterior.value > 0
  ? Math.min(Math.round((etapa.value / anterior.value) * 1000) / 10, 100)
  : 0
```

### Alteracao no Backend

Arquivo `backend/src/services/relatorio.service.ts` — As taxas `lead_para_mql`, `mql_para_sql`, etc. ja sao calculadas corretamente como etapa-a-etapa. Porem, adicionar cap de 100% no `calcularTaxa`:

```typescript
function calcularTaxa(num: number, den: number): number | null {
  if (!den || den === 0) return null
  return Math.min(Math.round((num / den) * 1000) / 10, 100)
}
```

## Arquivos Modificados

1. **`src/modules/app/components/dashboard/FunilConversao.tsx`** — Alterar calculo para usar topo do funil + cap 100%
2. **`backend/src/services/relatorio.service.ts`** — Adicionar cap de 100% na funcao `calcularTaxa`

## Resultado

- Percentuais nunca ultrapassam 100%
- Analise estrategica real: mostra onde o funil "perde" volume
- Gargalos ficam claros (ex: se MQL→SQL tem 20%, o problema esta na qualificacao comercial)
- Padrao alinhado com HubSpot / Salesforce / RD Station
