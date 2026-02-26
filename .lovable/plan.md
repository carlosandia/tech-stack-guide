
# Dashboard Completo com Metricas Gerais e Graficos

## Visao Geral

Expandir o dashboard atual para incluir metricas gerais operacionais, graficos de motivos de perda, ranking de produtos mais vendidos e historico de oportunidades com variacoes percentuais. Tudo com tooltips informativos em linguagem acessivel.

## Estrutura Final do Dashboard (ordem)

```text
1. Header + Filtros (ja existe)
2. Funil de Conversao (ja existe)
3. Invest Mode (ja existe)
4. Cards KPIs Principais (REFORMULADO - 6 cards)
   - Novos Leads | Vendas (qtd) | Receita Total | Perdas | Ticket Medio | Forecast
5. Cards Secundarios (NOVO - 4 cards)
   - Ciclo Medio | Tarefas em Aberto | Total Oportunidades | Conversao Geral
6. Grafico: Motivos de Perda (NOVO - Recharts horizontal bar chart)
7. Ranking: Produto Mais Vendido (NOVO - lista ranqueada)
8. Breakdown por Canal (ja existe)
```

## Novas Metricas Necessarias

### Dados que serao buscados diretamente via Supabase queries (sem RPC):

| Metrica | Tabela | Query |
|---------|--------|-------|
| Perdas (qtd) | oportunidades + etapas_funil (tipo='perda') | COUNT com fechado_em no periodo |
| Receita de perdas | oportunidades | SUM(valor) das perdas |
| Tarefas em aberto | tarefas | COUNT(status IN pendente, em_andamento) |
| Motivos de perda | oportunidades + motivos_resultado | GROUP BY motivo_resultado_id com JOIN |
| Produto mais vendido | oportunidades_produtos + produtos | GROUP BY produto_id, SUM(quantidade) |
| Total de oportunidades no historico | oportunidades | COUNT total (sem filtro de periodo) |

### Variacoes (crescimento vs periodo anterior):

Cada card com variacao mostrara:
- Seta verde para cima com "+X%" quando positivo
- Seta vermelha para baixo com "-X%" quando negativo  
- "s/d" (sem dados) quando nao ha periodo anterior

## Detalhamento Tecnico

### 1. Nova funcao RPC `fn_dashboard_metricas_gerais`

Criar migration com funcao PostgreSQL que retorna em uma unica chamada:
- `perdas` (count de oportunidades em etapa tipo='perda' fechadas no periodo)
- `valor_perdas` (soma dos valores das perdas)
- `tarefas_abertas` (count de tarefas com status pendente/em_andamento)
- `total_oportunidades_historico` (count total sem filtro de periodo)
- `motivos_perda` (array JSON com nome, cor, quantidade, percentual)
- `produtos_ranking` (array JSON com nome_produto, quantidade_vendida, receita_gerada)

Parametros: `p_organizacao_id`, `p_periodo_inicio`, `p_periodo_fim`, `p_funil_id`

### 2. Atualizar Types (`relatorio.types.ts`)

Adicionar interface `DashboardMetricasGerais`:
```typescript
interface DashboardMetricasGerais {
  perdas: number
  valor_perdas: number
  tarefas_abertas: number
  total_oportunidades_historico: number
  motivos_perda: Array<{ nome: string; cor: string; quantidade: number; percentual: number }>
  produtos_ranking: Array<{ nome: string; quantidade: number; receita: number }>
}
```

### 3. Atualizar Service (`relatorio.service.ts`)

- Adicionar `fetchDashboardMetricasGerais()` que chama a nova RPC
- Adicionar chamada para metricas do periodo anterior (para variacao de perdas)

### 4. Atualizar Hook (`useRelatorioFunil.ts`)

- Novo hook `useDashboardMetricasGerais(query)` com TanStack Query

### 5. Novos Componentes

| Componente | Descricao |
|-----------|-----------|
| `KPIsPrincipais.tsx` | Grid 6 cards: Novos Leads, Vendas, Receita, Perdas, Ticket Medio, Forecast - todos com variacao e tooltip |
| `KPIsSecundarios.tsx` | Grid 4 cards: Ciclo Medio, Tarefas Abertas, Total Historico, Conversao Geral |
| `MotivosPerda.tsx` | Grafico de barras horizontal (Recharts) com motivos de perda ranqueados |
| `ProdutosRanking.tsx` | Lista visual ranqueada com barras proporcionais e medalhas (1o, 2o, 3o) |

### 6. Atualizar `KPIsEstrategicos.tsx`

Remover o componente antigo e substituir pelos novos `KPIsPrincipais` e `KPIsSecundarios`.

### 7. Atualizar `DashboardPage.tsx`

Adicionar os novos componentes na ordem correta.

## Tooltips (linguagem acessivel)

| Metrica | Tooltip |
|---------|---------|
| Novos Leads | "Quantidade de oportunidades criadas no periodo selecionado" |
| Vendas | "Quantidade de negocios fechados como ganhos no periodo" |
| Receita Total | "Soma dos valores de todos os negocios ganhos" |
| Perdas | "Quantidade de negocios perdidos no periodo" |
| Ticket Medio | "Valor medio dos negocios ganhos. Formula: receita total dividida pelo numero de vendas" |
| Forecast | "Previsao de receita baseada no valor e probabilidade de cada etapa do funil" |
| Ciclo Medio | "Tempo medio entre a criacao e o fechamento de um negocio" |
| Tarefas Abertas | "Total de tarefas pendentes ou em andamento da sua equipe" |
| Total Historico | "Todas as oportunidades ja criadas, independente do periodo" |
| Conversao Geral | "Percentual de leads que se tornaram vendas no periodo" |

## Grafico de Motivos de Perda

- Recharts `BarChart` horizontal
- Cada barra com a cor do motivo (`motivos_resultado.cor`)
- Label: nome do motivo + quantidade + percentual
- Titulo: "Principais Motivos de Perda"
- Tooltip do titulo: "Razoes mais comuns pelas quais negocios foram perdidos no periodo"

## Ranking de Produtos

- Lista ordenada por quantidade vendida (desc)
- Top 5 produtos
- Cada item mostra: posicao (medalha ouro/prata/bronze para top 3), nome, quantidade, receita
- Barra proporcional ao mais vendido
- Titulo: "Produtos Mais Vendidos"
- Tooltip: "Ranking dos produtos com maior volume de vendas no periodo"

## Arquivos Alterados/Criados

| Arquivo | Acao |
|---------|------|
| Supabase migration (fn_dashboard_metricas_gerais) | Criar |
| `src/modules/app/types/relatorio.types.ts` | Editar - adicionar tipos |
| `src/modules/app/services/relatorio.service.ts` | Editar - nova funcao |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Editar - novo hook |
| `src/modules/app/components/dashboard/KPIsPrincipais.tsx` | Criar |
| `src/modules/app/components/dashboard/KPIsSecundarios.tsx` | Criar |
| `src/modules/app/components/dashboard/MotivosPerda.tsx` | Criar |
| `src/modules/app/components/dashboard/ProdutosRanking.tsx` | Criar |
| `src/modules/app/components/dashboard/KPIsEstrategicos.tsx` | Remover (substituido) |
| `src/modules/app/pages/DashboardPage.tsx` | Editar - nova composicao |
