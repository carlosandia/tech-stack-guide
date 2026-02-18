

## Auditoria de Producao — Modulo /dashboard

Analise dos dois dashboards (Super Admin e CRM App) para 500+ usuarios, conforme diretrizes do Arquiteto de Produto.

---

### Escopo

O modulo /dashboard engloba dois componentes:

1. **Dashboard Super Admin** (`src/modules/admin/pages/DashboardPage.tsx` + `obterMetricasResumo` em `admin.api.ts`)
2. **Dashboard CRM App** (`src/modules/app/pages/DashboardPage.tsx`) — placeholder estatico sem queries

A analise foca no Super Admin Dashboard, que e o unico com logica de dados.

---

### 1. Problemas Identificados

#### 1.1 Queries sequenciais em `obterMetricasResumo` (GARGALO)

Linhas 1094-1133 de `admin.api.ts`: A funcao faz **6 queries sequenciais** ao banco (organizacoes por status, novos no periodo, total usuarios, ativos hoje, ativos 7d, distribuicao por plano). Cada query e um round-trip independente.

**Correcao**: Agrupar as 6 queries em `Promise.all` para execucao paralela. Reduz latencia de `6 x RTT` para `1 x RTT`.

**Risco**: Zero. Queries sao independentes entre si.

---

#### 1.2 Query de organizacoes busca dados completos para contar status

Linhas 1094-1102: Usa `.select('status', { count: 'exact' })` mas retorna TODOS os registros para fazer `reduce` no frontend. Deveria usar queries `head: true` separadas por status, ou uma unica query que retorna todos os status e faz a contagem client-side (aceitavel para poucas centenas de tenants).

**Avaliacao**: Para escala de plataforma SaaS, o numero de tenants raramente ultrapassa milhares. A abordagem atual e aceitavel, mas adicionar `.limit(10000)` como trava de seguranca e prudente.

**Correcao**: Adicionar `.limit(10000)` na query de organizacoes por status.

**Risco**: Zero.

---

#### 1.3 Distribuicao por plano calcula percentual incorreto

Linhas 1136-1152: A query de distribuicao filtra por `criado_em >= dataInicioISO` (periodo selecionado), mas usa `totalOrgs` (total geral sem filtro de periodo) como denominador do percentual. Isso gera percentuais incorretos.

**Correcao**: Usar o total do periodo como denominador, nao o total geral:

```typescript
const totalPeriodo = (planosList || []).length
// ...
percentual: totalPeriodo ? (quantidade / totalPeriodo) * 100 : 0,
```

**Risco**: Zero. Correcao de bug logico.

---

#### 1.4 `novos_7d` e `novos_30d` retornam o mesmo valor

Linhas 1177-1178: Ambos os campos recebem `novosPeriodo`, que e filtrado pelo periodo selecionado (pode ser 7d, 30d, 60d ou 90d). Isso significa que se o periodo for 30d, tanto `novos_7d` quanto `novos_30d` mostram o valor de 30 dias.

**Correcao**: Fazer queries separadas para 7d e 30d fixos (independente do periodo selecionado), pois esses sao KPIs absolutos do card "Crescimento".

**Risco**: Zero. Uma query adicional (ja paralelizada no Promise.all).

---

#### 1.5 Hook `useQuery` sem `staleTime` no dashboard

Linha 41-44 de `DashboardPage.tsx`: O hook nao tem `staleTime`, causando refetch a cada foco de janela. Metricas de dashboard nao mudam em segundos.

**Correcao**: Adicionar `staleTime: 60_000` (1 minuto).

**Risco**: Zero.

---

#### 1.6 `listarUsuariosOrganizacao` sem `.limit()`

Linhas 555-561 de `admin.api.ts`: Busca todos os usuarios de uma organizacao sem limit. Para organizacoes grandes (50+ usuarios), nao ha trava.

**Correcao**: Adicionar `.limit(200)`.

**Risco**: Zero.

---

#### 1.7 `obterLimitesOrganizacao` — 5 queries sequenciais

Linhas 589-675 de `admin.api.ts`: Faz 5 queries sequenciais (usuarios, oportunidades, contatos, org, plano + storage RPC). As 3 contagens + org podem rodar em paralelo.

**Correcao**: Agrupar as primeiras 4 queries em `Promise.all`.

**Risco**: Zero.

---

### 2. O que ja esta BEM FEITO

- Dashboard CRM App e um placeholder estatico sem queries (correto para a fase atual)
- Queries de contagem usam `{ count: 'exact', head: true }` onde possivel (usuarios, oportunidades, contatos)
- `listarOrganizacoes` tem paginacao correta com `.range()` e `{ count: 'exact' }`
- JOIN otimizado para evitar N+1 na listagem de organizacoes
- Skeleton loading states bem implementados
- Periodo selecionavel no dashboard Super Admin
- Cards de metricas bem estruturados
- `listarPreCadastros` com paginacao correta
- `revogarCortesia` com operacoes atomicas corretas
- Hooks React Query com `queryKey` consistentes e `invalidateQueries` corretos

---

### 3. Plano de Acao

| # | Acao | Arquivo | Impacto |
|---|------|---------|---------|
| 1 | Paralelizar 6 queries com Promise.all | `admin.api.ts` (`obterMetricasResumo`) | Latencia 6xRTT para 1xRTT |
| 2 | Corrigir percentual de distribuicao por plano | `admin.api.ts` (`obterMetricasResumo`) | Bug logico corrigido |
| 3 | Separar novos_7d e novos_30d como queries fixas | `admin.api.ts` (`obterMetricasResumo`) | KPIs corretos |
| 4 | Adicionar staleTime no useQuery do dashboard | `DashboardPage.tsx` (admin) | Evita refetch desnecessario |
| 5 | Adicionar .limit(200) em listarUsuariosOrganizacao | `admin.api.ts` | Trava de seguranca |
| 6 | Paralelizar queries em obterLimitesOrganizacao | `admin.api.ts` | Reduz latencia |
| 7 | Adicionar .limit(10000) na query de status | `admin.api.ts` (`obterMetricasResumo`) | Trava de seguranca |

---

### 4. Detalhes Tecnicos

**4.1 Promise.all em obterMetricasResumo (admin.api.ts)**

Substituir as 6 queries sequenciais por:

```typescript
const [
  orgsResult,
  novos7dResult,
  novos30dResult,
  totalUsuariosResult,
  ativosHojeResult,
  ativos7dResult,
  planosListResult,
] = await Promise.all([
  supabase.from('organizacoes_saas').select('status', { count: 'exact' }).is('deletado_em', null).limit(10000),
  supabase.from('organizacoes_saas').select('*', { count: 'exact', head: true }).gte('criado_em', seteDiasAtrasISO).is('deletado_em', null),
  supabase.from('organizacoes_saas').select('*', { count: 'exact', head: true }).gte('criado_em', trintaDiasAtrasISO).is('deletado_em', null),
  supabase.from('usuarios').select('id', { count: 'exact', head: true }).is('deletado_em', null),
  supabase.from('usuarios').select('id', { count: 'exact', head: true }).is('deletado_em', null).gte('ultimo_login', hojeInicioISO),
  supabase.from('usuarios').select('id', { count: 'exact', head: true }).is('deletado_em', null).gte('ultimo_login', seteDiasAtrasISO),
  supabase.from('organizacoes_saas').select('plano').is('deletado_em', null).gte('criado_em', dataInicioISO),
])
```

**4.2 Corrigir percentual de distribuicao**

```typescript
const totalPeriodo = (planosList || []).length
const distribuicao = Object.entries(planoCounts).map(([plano, quantidade]) => ({
  plano,
  quantidade,
  percentual: totalPeriodo ? (quantidade / totalPeriodo) * 100 : 0,
}))
```

**4.3 novos_7d e novos_30d fixos**

Usar os resultados do Promise.all:
```typescript
tenants: {
  novos_7d: novos7dResult.count || 0,
  novos_30d: novos30dResult.count || 0,
}
```

**4.4 staleTime no DashboardPage.tsx**

```typescript
const { data: metricas, isLoading, error } = useQuery({
  queryKey: ['admin', 'metricas', 'resumo', periodo],
  queryFn: () => adminApi.obterMetricasResumo(periodo),
  staleTime: 60_000,
})
```

**4.5 Limit em listarUsuariosOrganizacao**

Adicionar `.limit(200)` apos `.order()`.

**4.6 Promise.all em obterLimitesOrganizacao**

```typescript
const [
  { count: usuariosCount },
  { count: opCount },
  { count: contatosCount },
  { data: org },
] = await Promise.all([
  supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('organizacao_id', id).is('deletado_em', null),
  supabase.from('oportunidades').select('*', { count: 'exact', head: true }).eq('organizacao_id', id).is('deletado_em', null),
  supabase.from('contatos').select('*', { count: 'exact', head: true }).eq('organizacao_id', id).is('deletado_em', null),
  supabase.from('organizacoes_saas').select('limite_usuarios, limite_oportunidades, limite_storage_mb, plano').eq('id', id).single(),
])
```

---

### 5. Arquivos impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/modules/admin/services/admin.api.ts` | Promise.all, bug fix, limits |
| `src/modules/admin/pages/DashboardPage.tsx` | staleTime |

### 6. Garantias de seguranca

- Nenhum componente visual alterado
- Nenhuma prop removida ou renomeada
- Cards de metricas inalterados
- Distribuicao por plano corrigida (melhora, nao quebra)
- Hooks mantem mesma assinatura
- Dashboard CRM App nao tocado (placeholder estatico)
- RLS continua como unica linha de defesa

