

# Plano: Indicadores Estrategicos de Reunioes no Dashboard

## Analise Estrategica

As metricas de reuniao (no-show, reagendamento, cancelamento) sao **indicadores de qualidade do processo comercial** — elas explicam o gap entre "Reunioes Agendadas" e "Reunioes Realizadas" no funil. Colocar esses dados dentro do funil de conversao poluiria a visualizacao linear do pipeline. O melhor posicionamento e como uma **nova secao dedicada** logo abaixo do Funil de Conversao, com cards de KPIs que complementam a analise.

### Metricas a exibir

| Metrica | Calculo | Valor estrategico |
|---|---|---|
| No-Shows | `COUNT WHERE status = 'noshow'` no periodo | Quantos prospects nao compareceram |
| Canceladas | `COUNT WHERE status = 'cancelada'` no periodo | Reunioes canceladas |
| Reagendadas | `COUNT WHERE data_inicio foi alterada` (audit_log com acao `reuniao_reagendada`) | Instabilidade no agendamento |
| Taxa de No-Show | `no_shows / agendadas * 100` | Qualidade dos leads agendados |
| Taxa de Comparecimento | `realizadas / agendadas * 100` | Eficiencia do agendamento |

## Etapas de Implementacao

### 1. Atualizar RPC `fn_metricas_funil`
Adicionar 3 novas metricas na funcao PostgreSQL:
- `reunioes_noshow`: COUNT de reunioes com `status = 'noshow'` no periodo
- `reunioes_canceladas`: COUNT de reunioes com `status = 'cancelada'` e `cancelada_em` no periodo
- `reunioes_reagendadas`: COUNT de registros no `audit_log` com `acao = 'reuniao_reagendada'` no periodo

### 2. Atualizar Types e Schemas
- Adicionar `reunioes_noshow`, `reunioes_canceladas`, `reunioes_reagendadas` em `MetricasBrutas`
- Adicionar na interface `RelatorioFunilResponse.funil`
- Adicionar taxas derivadas: `taxa_noshow` e `taxa_comparecimento`
- Espelhar no schema Zod do backend

### 3. Atualizar Services (Backend + Frontend)
- Backend: extrair os novos campos do RPC, calcular `taxa_noshow` e `taxa_comparecimento`
- Frontend: mapear os novos campos no service de fetch

### 4. Criar componente `IndicadoresReunioes.tsx`
Nova secao no dashboard com 5 cards em grid:
- **No-Shows** (icone AlertTriangle, cor amarela) — quantidade + motivos mais frequentes
- **Canceladas** (icone XCircle, cor vermelha) — quantidade
- **Reagendadas** (icone RefreshCw, cor violeta) — quantidade
- **Taxa de No-Show** (icone Percent, cor amber) — percentual
- **Taxa de Comparecimento** (icone CheckCircle, cor emerald) — percentual

O componente seguira o mesmo padrao visual dos Indicadores Operacionais (cards com icone, label uppercase, valor grande).

### 5. Integrar na pagina do Dashboard
Posicionar a nova secao logo abaixo do Funil de Conversao e acima dos Indicadores Operacionais, pois contextualiza o gap entre agendadas e realizadas.

## Secao Tecnica

```text
Dashboard Layout (ordem das secoes):
+---------------------------------------------+
| Filtros (periodo, funil, canal)              |
+---------------------------------------------+
| Indicadores Principais (6 KPIs)             |
+---------------------------------------------+
| Funil de Conversao (6 etapas)               |
+---------------------------------------------+
| Indicadores de Reunioes (5 cards) ← NOVO    |
+---------------------------------------------+
| Indicadores Operacionais (4 cards)           |
+---------------------------------------------+
| Metas | Motivos Perda | Ranking Produtos     |
+---------------------------------------------+
```

**Arquivos a criar:**
- `supabase/migrations/xxx_add_metricas_reunioes.sql` — nova versao do RPC
- `src/modules/app/components/dashboard/IndicadoresReunioes.tsx` — novo componente

**Arquivos a editar:**
- `src/modules/app/types/relatorio.types.ts` — novos campos
- `backend/src/schemas/relatorio.ts` — novos campos no Zod
- `backend/src/services/relatorio.service.ts` — extrair e calcular novas metricas
- `src/modules/app/services/relatorio.service.ts` — mapear campos no frontend
- Pagina do Dashboard (onde monta os componentes) — adicionar `IndicadoresReunioes`

