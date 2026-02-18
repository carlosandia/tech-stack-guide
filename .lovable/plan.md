
## Auditoria de Producao — Modulo /tarefas

Analise para 500+ usuarios, alto volume de tarefas e oportunidades, conforme diretrizes do Arquiteto de Produto.

---

### 1. Problemas Criticos

#### 1.1 Cache auth duplicado (tarefas.api.ts)

Linhas 17-77: Mesma duplicacao de `_cachedOrgId`, `_cachedUserId`, `_cachedUserRole` com `onAuthStateChange` local. Identica ao padrao ja corrigido nos modulos /emails, /formularios, /configuracoes, /automacoes. O `auth-context.ts` compartilhado ja existe e exporta `getOrganizacaoId`, `getUsuarioId` e `getUserRole`.

**Correcao**: Remover linhas 17-77 e importar de `@/shared/services/auth-context`.

**Risco**: Zero. Refactor DRY puro.

---

#### 1.2 Filtro `pipeline_id` em memoria (GARGALO)

Linhas 270-274: Apos buscar tarefas paginadas do banco, filtra por `pipeline_id` no frontend via `.filter()`. Isso causa dois problemas graves:

1. **Paginacao quebrada**: Se a pagina tem 20 resultados e 5 sao do pipeline errado, o usuario ve 15 itens em vez de 20.
2. **Total incorreto**: O count vem do banco (sem filtro de pipeline), mas os dados sao filtrados localmente, criando inconsistencia entre `total` e dados exibidos.

**Correcao**: Mover o filtro para o banco. Buscar os `oportunidade_id`s do pipeline antes da query principal e usar `.in('oportunidade_id', ids)`. Alternativamente, filtrar via `etapa_origem_id` que ja e coluna da tabela `tarefas`.

```typescript
if (params?.pipeline_id) {
  // Buscar oportunidades do pipeline
  const { data: ops } = await supabase
    .from('oportunidades')
    .select('id')
    .eq('funil_id', params.pipeline_id)
    .is('deletado_em', null)
    .limit(1000)
  const opIds = (ops || []).map(o => o.id)
  if (opIds.length === 0) {
    return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } }
  }
  query = query.in('oportunidade_id', opIds)
}
```

---

#### 1.3 3 queries auth sequenciais em `listar` e `obterMetricas`

Linhas 171-173 e 301-303: Cada chamada faz `getOrganizacaoId()`, `getUsuarioId()`, `getUserRole()` sequencialmente (3 awaits). Mesmo com cache, na primeira chamada sao 6 queries ao banco (2 por funcao). Com o auth-context compartilhado, o cache e global e ja resolve isso, mas as chamadas ainda sao sequenciais.

**Correcao**: Agrupar em `Promise.all`:

```typescript
const [organizacaoId, usuarioId, role] = await Promise.all([
  getOrganizacaoId(),
  getUsuarioId(),
  getUserRole(),
])
```

---

#### 1.4 Enrichment de funis/etapas sem limit

Linhas 249-256: Busca funis e etapas para enriquecer nomes, mas sem `.limit()`. Em cenarios normais o volume e baixo (poucos funis), mas como boa pratica deve ter trava.

**Correcao**: Adicionar `.limit(100)` em ambas as queries de enrichment.

**Risco**: Zero.

---

#### 1.5 `listarMembros` e `listarFunis` sem limit

Linhas 452-461 e 468-478: Ambas funcoes buscam sem `.limit()`. Com organizacoes grandes (50+ membros, 20+ funis), nao ha trava.

**Correcao**: Adicionar `.limit(100)` em `listarMembros` e `.limit(50)` em `listarFunis`.

---

#### 1.6 Hooks sem `staleTime` na listagem principal

Linhas 10-15 (useTarefas): O hook `useTarefas` nao tem `staleTime`, o que significa que cada mudanca de tab/foco do browser refaz a query completa. Os hooks de filtro (`useMembrosEquipe`, `useFunisFiltro`) ja tem `staleTime` correto.

**Correcao**: Adicionar `staleTime: 30_000` (30s) no `useTarefas` e `useTarefasMetricas`.

---

### 2. O que ja esta BEM FEITO

- Paginacao com `.range()` e `{ count: 'exact' }` na listagem principal
- Metricas com `{ count: 'exact', head: true }` (sem transferir dados para contagem)
- `Promise.all` nas 4 queries de metricas (execucao paralela)
- `.limit(500)` na query de tempo medio (trava de seguranca)
- `Promise.all` no enrichment de funis/etapas
- Validacao de permissao Member na conclusao
- Hooks de filtro com `staleTime` adequado (5min membros, 5min funis, 2min etapas)
- Soft delete padronizado
- Componentes visuais bem estruturados com forwardRef e skeletons
- Cards de metricas clicaveis como filtro rapido

---

### 3. Plano de Acao

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Importar auth-context compartilhado | `tarefas.api.ts` | Elimina 60 linhas de duplicacao |
| 2 | Mover filtro pipeline_id para o banco | `tarefas.api.ts` | Corrige paginacao e contagem |
| 3 | Paralelizar chamadas auth com Promise.all | `tarefas.api.ts` | Reduz latencia na primeira chamada |
| 4 | Adicionar .limit() em enrichment e selects auxiliares | `tarefas.api.ts` | Travas de seguranca |
| 5 | Adicionar staleTime nos hooks principais | `useTarefas.ts` | Evita refetch desnecessario |

---

### 4. Detalhes Tecnicos

**4.1 Auth-context (tarefas.api.ts)**

Remover linhas 17-77. Substituir imports:
```typescript
import { getOrganizacaoId, getUsuarioId, getUserRole } from '@/shared/services/auth-context'
```

**4.2 Pipeline filter no banco (tarefas.api.ts)**

Mover o filtro de `pipeline_id` para ANTES da query principal:
```typescript
if (params?.pipeline_id) {
  const { data: ops } = await supabase
    .from('oportunidades')
    .select('id')
    .eq('funil_id', params.pipeline_id)
    .is('deletado_em', null)
    .limit(1000)
  const opIds = (ops || []).map(o => o.id)
  if (opIds.length === 0) {
    return { data: [], pagination: { page, limit, total: 0, total_pages: 0 } }
  }
  query = query.in('oportunidade_id', opIds)
}
```

Remover o bloco pos-query das linhas 270-278.

**4.3 Promise.all para auth (tarefas.api.ts)**

Em `listar` e `obterMetricas`:
```typescript
const [organizacaoId, usuarioId, role] = await Promise.all([
  getOrganizacaoId(), getUsuarioId(), getUserRole(),
])
```

**4.4 Limits (tarefas.api.ts)**

- Enrichment funis: `.limit(100)`
- Enrichment etapas: `.limit(100)`
- `listarMembros`: `.limit(100)`
- `listarFunis`: `.limit(50)`

**4.5 staleTime (useTarefas.ts)**

```typescript
export function useTarefas(params?: ListarTarefasParams) {
  return useQuery({
    queryKey: ['tarefas-lista', params],
    queryFn: () => tarefasApi.listar(params),
    staleTime: 30_000,
  })
}

export function useTarefasMetricas(params?: ...) {
  return useQuery({
    queryKey: ['tarefas-metricas', params],
    queryFn: () => tarefasApi.obterMetricas(params),
    staleTime: 30_000,
  })
}
```

---

### 5. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/tarefas/services/tarefas.api.ts` | Auth-context, pipeline filter, limits, Promise.all |
| `src/modules/tarefas/hooks/useTarefas.ts` | staleTime nos hooks principais |

### 6. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Hooks mantem mesma assinatura e comportamento
- Paginacao corrigida (melhora, nao quebra)
- Cards de metricas inalterados
- Modal de conclusao inalterado
- Backend Express (routes + service) inalterado
- RLS continua como unica linha de defesa
