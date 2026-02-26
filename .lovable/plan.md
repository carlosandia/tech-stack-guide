

# PRD-18: Implementacao Frontend do Dashboard de Relatorio de Funil

## Resumo

Transformar o `/dashboard` placeholder (com valores "---") em um centro analitico completo com graficos modernos, conectado ao backend ja implementado (`GET /api/v1/relatorio/funil` e `POST /api/v1/relatorio/investimento`).

## Biblioteca Escolhida: Tremor

Apos pesquisa, a biblioteca recomendada e **Tremor** (`@tremor/react`):

- **Visual moderno**: graficos com animacoes suaves, tooltips interativos, cores bonitas por padrao
- **Stack compativel**: construido sobre Recharts + Tailwind CSS + Radix UI (tudo ja na stack)
- **Feito para dashboards**: componentes como BarChart, DonutChart, AreaChart, Tracker, BarList, SparkChart - todos pensados para analise de dados
- **Facil de usar**: props simples, dados em array de objetos, sem configuracao complexa
- **Responsivo**: suporta todos os viewports nativamente
- **Open-source**: 35+ componentes gratuitos

Alternativas descartadas:
- **Recharts puro**: funcional mas exige muito CSS manual para ficar bonito
- **Nivo**: visual excelente mas API complexa e bundle pesado
- **Chart.js / react-chartjs-2**: imperative, menos React-friendly
- **ApexCharts**: bom visual mas nao usa Tailwind CSS nativamente

## Erro de Build Pre-existente

O erro `Could not find a matching package for 'npm:stripe@14.14.0'` e da edge function `supabase/functions/create-checkout-session/index.ts` e **nao e relacionado** a esta implementacao. E um problema de ambiente Deno. Sera corrigido adicionando um `deno.json` com a dependencia.

## Plano de Implementacao

### Fase 0: Correcoes pre-existentes

**Arquivo:** `supabase/functions/create-checkout-session/deno.json`
- Criar arquivo com `"nodeModulesDir": "auto"` para resolver o erro de build do Stripe

### Fase 1: Instalacao e Service Layer

**Dependencia nova:** `@tremor/react` (instalar via package.json)

**Arquivo novo:** `src/modules/app/services/relatorio.service.ts`
- Funcao `fetchRelatorioFunil(params)` que chama `GET /v1/relatorio/funil` via `api` (axios)
- Funcao `salvarInvestimento(payload)` que chama `POST /v1/relatorio/investimento`
- Types importados do schema existente em `backend/src/schemas/relatorio.ts` (criar espelho no frontend)

**Arquivo novo:** `src/modules/app/types/relatorio.types.ts`
- Espelho dos types do backend: `RelatorioFunilResponse`, `FunilQuery`, `SalvarInvestimentoPayload`

### Fase 2: Hook de dados

**Arquivo novo:** `src/modules/app/hooks/useRelatorioFunil.ts`
- Hook com TanStack Query (`useQuery`) para buscar dados do funil
- Params: `periodo`, `funil_id`, `canal`
- Stale time: 5 minutos (alinhado com cache do backend)
- Hook auxiliar `useFunis()` para popular o select de funis

### Fase 3: Componentes do Dashboard (6 arquivos)

Todos em `src/modules/app/components/dashboard/`:

1. **`DashboardFilters.tsx`**
   - Select de periodo: 7d, 30d, 90d, personalizado
   - Select de funil (populado via `useFunis`)
   - DatePicker para periodo personalizado (usar react-day-picker ja instalado)

2. **`FunilConversao.tsx`** (componente principal do funil)
   - 5 blocos horizontais: Leads -> MQLs -> SQLs -> Reunioes -> Ganhos
   - Cada bloco: volume absoluto + taxa de conversao vs etapa anterior
   - Setas entre blocos com % de conversao
   - Em mobile (<768px): colapsa para cards verticais
   - Usa Tremor `BarChart` ou cards customizados com animacao
   - Estados vazios inteligentes com dicas contextuais

3. **`KPIsEstrategicos.tsx`**
   - 4 cards: Ticket Medio, Valor Gerado, Ciclo Medio, Forecast
   - Cada card com variacao vs periodo anterior (seta verde/vermelha + %)
   - Usa Tremor `Card` + `BadgeDelta` para variacoes
   - Tooltips explicativos com formula de calculo

4. **`BreakdownCanal.tsx`**
   - Tabela/lista com canais de origem (utm_source)
   - Colunas: Canal, Leads, % do Total, Fechados, Taxa de Fechamento
   - Usa Tremor `BarList` ou `DonutChart` para visualizacao
   - Barras horizontais coloridas por canal

5. **`InvestModeWidget.tsx`** (Fase 2 do PRD, mas UI preparada)
   - Banner "Desbloqueie metricas de custo" quando invest_mode.ativo = false
   - Formulario inline: Meta Ads, Google Ads, Outros (campos R$)
   - Quando ativo: exibe CPL, CAC, ROMI como cards adicionais
   - Usa `useMutation` do TanStack Query para salvar

6. **`DashboardSkeleton.tsx`**
   - Skeleton loader completo para todo o dashboard
   - Nenhum "---" aparece durante carregamento

### Fase 4: Pagina principal

**Arquivo editado:** `src/modules/app/pages/DashboardPage.tsx`
- Substituir completamente o conteudo placeholder
- Montar: Filtros -> Funil -> InvestMode -> KPIs -> Breakdown
- Gerenciar estado dos filtros (periodo, funil_id)
- Passar dados do hook para cada componente

### Estrutura Visual Proposta

```text
+------------------------------------------------------------------+
| Dashboard          [Ultimos 30 dias v] [Todos os funis v]        |
+------------------------------------------------------------------+
|                                                                   |
|  FUNIL DE CONVERSAO                                               |
|  [Leads 312] --> [MQL 56 (18%)] --> [SQL 18 (32%)] -->           |
|  [Reunioes 11 (61%)] --> [Ganhos 8 (73%)]                        |
|                                                                   |
+------------------------------------------------------------------+
|  [Desbloqueie metricas de custo - Informar investimento ->]      |
+------------------------------------------------------------------+
|  METRICAS                                                         |
|  +-------------+ +-------------+ +-----------+ +----------+      |
|  | Ticket Medio| | Valor Gerado| | Ciclo     | | Forecast |      |
|  | R$ 3.200    | | R$ 25.600   | | 22 dias   | | R$ 48.7k |      |
|  | +12%        | | +8%         | | -3d       | | 15 ops   |      |
|  +-------------+ +-------------+ +-----------+ +----------+      |
+------------------------------------------------------------------+
|  POR CANAL DE ORIGEM                                              |
|  [DonutChart]    meta_ads   45%  312 leads  8 fechados (2.5%)    |
|                  organico   30%  210 leads  12 fechados (5.7%)   |
|                  google     15%  105 leads  4 fechados (3.8%)    |
|                  indicacao  10%  70 leads   6 fechados (8.6%)    |
+------------------------------------------------------------------+
```

### Componentes Tremor utilizados

| Componente Tremor | Uso no Dashboard |
|---|---|
| `BarChart` | Funil de conversao (barras decrescentes) |
| `DonutChart` | Breakdown por canal (rosquinha colorida) |
| `BarList` | Lista de canais com barras proporcionais |
| `BadgeDelta` | Variacoes % nos KPIs (verde/vermelho) |
| `SparkAreaChart` | Mini grafico de tendencia nos KPIs |
| `Card` | Container dos KPIs |
| `Tracker` | Possivel uso futuro para atividades |

### Responsividade

- **Desktop (1024px+)**: Layout completo lado a lado
- **Tablet (768-1023px)**: KPIs em 2 colunas, funil horizontal
- **Mobile (<768px)**: Funil em cards verticais, KPIs em 1 coluna, DonutChart empilhado

### Arquivos criados/editados (resumo)

| Arquivo | Acao |
|---|---|
| `supabase/functions/create-checkout-session/deno.json` | Criar (fix build error) |
| `src/modules/app/types/relatorio.types.ts` | Criar |
| `src/modules/app/services/relatorio.service.ts` | Criar |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Criar |
| `src/modules/app/components/dashboard/DashboardFilters.tsx` | Criar |
| `src/modules/app/components/dashboard/FunilConversao.tsx` | Criar |
| `src/modules/app/components/dashboard/KPIsEstrategicos.tsx` | Criar |
| `src/modules/app/components/dashboard/BreakdownCanal.tsx` | Criar |
| `src/modules/app/components/dashboard/InvestModeWidget.tsx` | Criar |
| `src/modules/app/components/dashboard/DashboardSkeleton.tsx` | Criar |
| `src/modules/app/pages/DashboardPage.tsx` | Reescrever |

