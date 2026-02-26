
# Relatorio de Metas e Performance de Vendas no Dashboard

## Objetivo

Adicionar uma secao completa de **Indicadores de Metas** acima do funil de conversao no dashboard, trazendo:
- Saude geral da empresa (metas configuradas vs atingidas)
- Performance individual dos vendedores com graficos
- Ranking de vendedores e equipes
- Tudo compacto, organizado e respeitando os filtros de periodo

## Nova RPC: `fn_relatorio_metas_dashboard`

Criar uma funcao PostgreSQL que retorna todos os dados de metas em uma unica chamada:

**Parametros:** `p_organizacao_id`, `p_periodo_inicio`, `p_periodo_fim`

**Retorno JSON:**
```text
{
  resumo: { total_metas, metas_atingidas, media_atingimento, em_risco },
  metas_empresa: [{ nome, metrica, valor_meta, valor_atual, percentual, periodo }],
  vendedores: [{ usuario_id, nome, avatar_url, equipe_nome, metas: [{ metrica, valor_meta, valor_atual, percentual }], total_vendas, receita_gerada }],
  ranking_vendedores: [{ posicao, nome, avatar_url, percentual_medio, receita }],
  ranking_equipes: [{ posicao, nome, cor, total_membros, percentual_medio, receita }]
}
```

A funcao:
- Busca metas ativas cujo periodo (data_inicio/data_fim) intersecta o periodo do filtro
- Cruza com `metas_progresso` para valores atuais
- Agrega vendedores com suas metas individuais e dados de oportunidades ganhas (via `oportunidades` + `etapas_funil` tipo='ganho')
- Calcula ranking por percentual medio de atingimento de metas
- Agrupa equipes via `equipes_membros` para ranking de equipes

## Layout Visual

A nova secao fica **acima do funil de conversao**, logo apos o header/filtros:

```text
┌─────────────────────────────────────────────────────────────┐
│  INDICADORES DE METAS                                       │
│                                                             │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐       │
│  │ Total   │ │ Atingidas│ │ Media %   │ │ Em Risco │       │
│  │   5     │ │    2     │ │   67%     │ │    1     │       │
│  └─────────┘ └──────────┘ └───────────┘ └──────────┘       │
│                                                             │
│  ┌─ Metas da Empresa ─────────────────┐ ┌─ Ranking ───────┐│
│  │ Receita Total  ████████░░  R$150k  │ │ 1. Joao   92%  ││
│  │    67% · R$100k / R$150k           │ │ 2. Maria  85%  ││
│  │ Vendas         ██████░░░░  30      │ │ 3. Pedro  72%  ││
│  │    60% · 18 / 30                   │ │ Equipes:       ││
│  └────────────────────────────────────┘ │ 1. Inside 88%  ││
│                                         │ 2. Field  75%  ││
│  ┌─ Performance Vendedores ───────────────────────────────┐│
│  │ ┌─ Joao ──────────────┐ ┌─ Maria ─────────────┐      ││
│  │ │ Meta: R$50k → 92%   │ │ Meta: R$40k → 85%   │      ││
│  │ │ ████████████░░       │ │ ██████████░░░        │      ││
│  │ │ 12 vendas · R$46k   │ │ 8 vendas · R$34k     │      ││
│  │ └─────────────────────┘ └──────────────────────┘      ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Componentes

### 1. `RelatorioMetas.tsx` (componente principal)
Componente wrapper que organiza as subsecoes:
- Titulo "Indicadores de Metas" com icone Target
- 4 cards resumo (Total, Atingidas, Media, Em Risco)
- Grid 2 colunas: Metas da Empresa (esquerda) + Rankings (direita)
- Performance dos vendedores (abaixo, full width)

### 2. Cards Resumo (inline no componente)
4 cards compactos identicos ao estilo dos KPIs existentes, com cores semanticas:
- Total de Metas (azul)
- Metas Atingidas (verde)
- Media de Atingimento com barra radial simplificada (amarelo/verde)
- Em Risco (vermelho)

### 3. Metas da Empresa (inline)
Lista compacta das metas tipo `empresa` ativas, cada uma com:
- Nome da metrica + barra de progresso horizontal colorida
- Valor atual / valor meta
- Percentual

### 4. Rankings (inline)
Duas listas compactas empilhadas:
- **Top Vendedores**: Top 5 por percentual medio de atingimento com avatar, nome, percentual
- **Top Equipes**: Top 3 por percentual medio, com cor da equipe, nome, membros, percentual

### 5. Performance Vendedores (inline)
Grid de cards compactos por vendedor mostrando:
- Avatar + nome + equipe
- Barra de progresso da meta principal (ou media de todas)
- Numero de vendas e receita gerada no periodo
- Badge de status (atingiu / em risco / no caminho)

## Detalhamento Tecnico

### Arquivos a criar/editar:

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/[timestamp]_fn_relatorio_metas_dashboard.sql` | Criar RPC |
| `src/modules/app/types/relatorio.types.ts` | Adicionar tipos de metas dashboard |
| `src/modules/app/services/relatorio.service.ts` | Adicionar `fetchRelatorioMetas` |
| `src/modules/app/hooks/useRelatorioFunil.ts` | Adicionar `useRelatorioMetas` hook |
| `src/modules/app/components/dashboard/RelatorioMetas.tsx` | Criar componente completo |
| `src/modules/app/pages/DashboardPage.tsx` | Inserir `RelatorioMetas` acima do `FunilConversao` |

### Tipos novos:

```typescript
interface MetaEmpresaDashboard {
  nome: string
  metrica: string
  valor_meta: number
  valor_atual: number
  percentual: number
  periodo: string
}

interface VendedorPerformance {
  usuario_id: string
  nome: string
  avatar_url: string | null
  equipe_nome: string | null
  percentual_medio: number
  total_vendas: number
  receita_gerada: number
  metas: Array<{
    metrica: string
    valor_meta: number
    valor_atual: number
    percentual: number
  }>
}

interface RankingVendedor {
  posicao: number
  nome: string
  avatar_url: string | null
  percentual_medio: number
  receita: number
}

interface RankingEquipe {
  posicao: number
  nome: string
  cor: string | null
  total_membros: number
  percentual_medio: number
  receita: number
}

interface RelatorioMetasDashboard {
  resumo: {
    total_metas: number
    metas_atingidas: number
    media_atingimento: number
    em_risco: number
  }
  metas_empresa: MetaEmpresaDashboard[]
  vendedores: VendedorPerformance[]
  ranking_vendedores: RankingVendedor[]
  ranking_equipes: RankingEquipe[]
}
```

### RPC SQL:

A funcao busca:
1. Metas ativas cuja vigencia intersecta o periodo filtrado
2. Progresso de `metas_progresso`
3. Vendas reais de `oportunidades` WHERE `etapa_id` em etapas tipo `ganho` AND `fechado_em` no periodo
4. Agrupa por usuario para performance individual
5. Agrupa por equipe via `equipes_membros` para ranking de equipes

### Filtros respeitados:
- **Periodo**: filtra metas cuja vigencia intersecta o range, e vendas/oportunidades fechadas no periodo
- **Funil**: filtra oportunidades ganhas por funil (para receita/vendas), metas com `funil_id` correspondente quando aplicavel
- Se nao houver metas configuradas, a secao inteira fica oculta (sem mostrar estado vazio no dashboard)

### Estilo visual:
- Segue design system: cards com `bg-card border border-border rounded-xl`
- Barras de progresso com cores semanticas (verde >= 100%, azul >= 70%, amarelo >= 40%, vermelho < 40%)
- Rankings com medalhas (top 3) e avatares
- Responsivo: grid colapsa em mobile
