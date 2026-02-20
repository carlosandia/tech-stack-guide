# PRD: Melhorias de Performance para Escalabilidade

| Campo | Valor |
|-------|-------|
| **Autor** | Equipe Tecnica CRM Renove |
| **Data de criacao** | 2026-02-20 |
| **Ultima atualizacao** | 2026-02-20 |
| **Versao** | v1.0 |
| **Status** | Aprovado |
| **Stakeholders** | Desenvolvimento, Operacoes, Produto |
| **Revisor tecnico** | Claude Code |

---

## Resumo Executivo

Este documento define as melhorias de performance necessarias para suportar **300+ usuarios ativos simultaneos** com alto volume de oportunidades no CRM Renove.

O foco e em **quick wins** que nao introduzem novas dependencias (sem Redis, sem CDN) e tem baixo risco para producao. As otimizacoes incluem indices de banco de dados, configuracao de cache do TanStack Query, code splitting e subscricoes Realtime.

Impacto esperado: reducao de 50-80% no tempo de carregamento de listagens e reducao de 40-60% no tamanho do bundle inicial.

---

## Contexto e Motivacao

### Problema

O CRM esta em fase de crescimento e precisa suportar maior volume de usuarios e dados sem degradacao de performance. Diagnostico atual:

| Aspecto | Situacao | Impacto |
|---------|----------|---------|
| Indices `contatos` | Sem indices compostos | Full table scan em filtros |
| Indices `oportunidades` | Apenas 1 indice basico | Kanban lento com 1000+ cards |
| Code Splitting | Zero lazy loading | Bundle inicial 2-3MB |
| Realtime Contatos | Nao implementado | Dados desincronizados |
| staleTime emails | 30 segundos | Fetch excessivo |

### O que ja esta BEM implementado

| Aspecto | Status | Detalhes |
|---------|--------|----------|
| TanStack Query Config | Excelente | `staleTime: 60s`, `gcTime: 5min` |
| Paginacao Backend | Implementada | Offset-based com limit 100 max |
| Connection Pooling | Supabase | Supavisor incluso no plano |
| Realtime Conversas | Implementado | Channel isolado por tenant |
| Realtime Kanban | Implementado | postgres_changes em oportunidades |
| Indices Emails/Tarefas/Conversas | Completos | Multiplos indices compostos |

### Alinhamento Estrategico

- Preparacao para escala de 300-500 usuarios ativos
- Melhoria de experiencia do usuario (UX)
- Reducao de custos de infraestrutura
- Base tecnica solida para crescimento futuro

---

## Usuarios e Personas

### Persona Primaria

**Nome:** Admin de Vendas
**Role:** Admin
**Contexto:** Gerencia equipe de 10-50 vendedores, acompanha metricas
**Dores:**
- Kanban lento com muitos cards
- Listagem de contatos demora para carregar
- Precisa atualizar pagina para ver novos dados

### Persona Secundaria

**Nome:** Vendedor (Member)
**Role:** Member
**Contexto:** Trabalha com pipeline de 50-200 oportunidades ativas
**Dores:**
- Demora inicial ao abrir o CRM
- Dados nao sincronizam automaticamente entre abas

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Escalabilidade e Performance do CRM para suportar crescimento

### Epic (Iniciativa)

> Otimizacao de Performance sem Novas Dependencias

### Features e User Stories

**Feature:** Indices de Banco de Dados

**User Story:**
Como Admin,
Quero que as listagens de contatos e oportunidades carreguem rapidamente,
Para que eu possa gerenciar minha equipe sem esperar.

**Criterios de Aceitacao:**
- [ ] Listagem de contatos carrega em menos de 200ms
- [ ] Kanban de oportunidades carrega em menos de 300ms
- [ ] Filtros aplicam instantaneamente

**Prioridade:** Must-have

---

**Feature:** Code Splitting

**User Story:**
Como usuario do CRM,
Quero que a pagina inicial carregue rapidamente,
Para que eu possa comecar a trabalhar sem esperar download de codigo.

**Criterios de Aceitacao:**
- [ ] Bundle inicial menor que 800KB
- [ ] LCP (Largest Contentful Paint) menor que 1.5s
- [ ] Modulos carregam sob demanda ao navegar

**Prioridade:** Must-have

---

**Feature:** Realtime para Contatos

**User Story:**
Como vendedor,
Quero ver novos contatos automaticamente sem atualizar a pagina,
Para que eu nao perca leads recem criados.

**Criterios de Aceitacao:**
- [ ] Novos contatos aparecem automaticamente na listagem
- [ ] Updates refletem em tempo real
- [ ] Funciona com multiplas abas abertas

**Prioridade:** Should-have

---

## Requisitos Funcionais

| ID | Requisito | Prioridade | Criterio de aceitacao |
|----|-----------|------------|----------------------|
| RF-001 | Criar indices compostos para tabela `contatos` | Must | Query EXPLAIN mostra uso do indice |
| RF-002 | Criar indices compostos para tabela `oportunidades` | Must | Query EXPLAIN mostra uso do indice |
| RF-003 | Implementar lazy loading de modulos | Must | Bundle inicial < 800KB |
| RF-004 | Corrigir staleTime do historico de emails | Should | staleTime = 5 minutos |
| RF-005 | Criar constantes de cache padronizadas | Should | Arquivo `query-config.ts` criado |
| RF-006 | Implementar Realtime para contatos | Could | Contatos sincronizam automaticamente |
| RF-007 | Otimizar RLS para super_admin | Could | Latencia Realtime reduzida |

---

## Requisitos Nao-Funcionais

### Performance

| Metrica | Valor Atual | Meta | Prazo |
|---------|-------------|------|-------|
| Tempo listagem contatos | ~500ms | <100ms | Fase 1 |
| Tempo Kanban load | ~800ms | <200ms | Fase 1 |
| Bundle inicial | ~2MB | <800KB | Fase 3 |
| LCP | ~3s | <1.5s | Fase 3 |

### Seguranca

- Indices nao afetam RLS
- Code splitting nao expoe rotas protegidas
- Realtime respeita isolamento de tenant

### Usabilidade

- Spinners de loading durante carregamento lazy
- Feedback visual durante sincronizacao Realtime
- Sem breaking changes na navegacao

### Sistema/Ambiente

- PostgreSQL com suporte a `CREATE INDEX CONCURRENTLY`
- React 18.3+ com suporte a `lazy()` e `Suspense`
- Supabase Realtime habilitado

---

## Escopo

### O que ESTA no escopo

- Indices para tabelas `contatos` e `oportunidades`
- Code splitting com React.lazy
- Otimizacao de cache TanStack Query
- Realtime subscription para contatos
- Otimizacao de RLS para super_admin

### O que NAO esta no escopo

- **Redis** - Planejado para migracao self-hosted futura
- **CDN/Cloudflare** - Sera implementado posteriormente
- **Cursor Pagination** - Offset funciona bem ate 100k rows
- **Sharding** - Desnecessario para 300 usuarios
- **Read Replicas** - Supabase Pro ja inclui

### Escopo futuro (backlog)

- Redis cache para sessoes
- CDN para assets estaticos
- Service Workers para cache offline
- Virtualizacao de listas longas

---

## Suposicoes, Dependencias e Restricoes

### Suposicoes

- Volume de dados: ate 100k contatos por tenant
- Usuarios simultaneos: 300-500 maximo
- Infraestrutura atual do Supabase suporta carga

### Dependencias

| Dependencia | Responsavel | Status | Risco |
|-------------|-------------|--------|-------|
| Supabase Realtime | Supabase | Disponivel | Baixo |
| PostgreSQL CONCURRENTLY | Supabase | Disponivel | Baixo |
| React 18 Suspense | Frontend | Disponivel | Baixo |

### Restricoes

- **Tecnicas:** Nao usar Redis ou CDN nesta fase
- **Operacionais:** Deploy em horario de baixo uso
- **Seguranca:** Manter RLS e isolamento de tenant

---

## Design e UX

### Fluxo do Usuario (Code Splitting)

1. Usuario acessa /login (carrega imediatamente)
2. Usuario faz login e e redirecionado para /app
3. Sistema exibe spinner enquanto carrega AppLayout
4. Usuario navega para /app/contatos
5. Sistema exibe spinner enquanto carrega ContatosPage
6. Proximas navegacoes usam cache do browser

### Consideracoes de UX

- Spinners devem ser sutis e rapidos
- Transicoes suaves entre modulos
- Feedback visual em operacoes Realtime

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline atual | Meta | Prazo |
|---------|----------------|------|-------|
| Tempo listagem contatos | ~500ms | <100ms | Apos Fase 1 |
| Tempo Kanban load | ~800ms | <200ms | Apos Fase 1 |
| Bundle inicial | ~2MB | <800KB | Apos Fase 3 |
| LCP | ~3s | <1.5s | Apos Fase 3 |

### KPIs Secundarios

- Reducao de requests ao backend
- Consumo de Realtime no Supabase < 500 conexoes/tenant
- Zero regressoes de funcionalidade

### Criterios de Lancamento

- [ ] Todos os indices criados com sucesso
- [ ] Testes de navegacao passando
- [ ] Performance validada em ambiente de producao
- [ ] Zero erros de console relacionados a lazy loading

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Indices quebram queries existentes | Baixa | Alto | Usar CONCURRENTLY, testar antes |
| Lazy loading quebra deep links | Media | Medio | Testar TODAS as rotas |
| Realtime aumenta custo Supabase | Media | Baixo | Monitorar consumo, implementar throttling |
| RLS optimization afeta permissoes | Media | Alto | Testar com todos os roles |
| Deploy causa downtime | Baixa | Alto | Deploy em horario de baixo uso |

---

## Time to Value (TTV)

### MVP (Minimo Viavel)

Fase 1 (Indices) ja gera valor imediato:
- Listagens 5-10x mais rapidas
- Sem mudanca de codigo frontend
- Deploy seguro com CONCURRENTLY

### Fases de Entrega

| Fase | Escopo | Prioridade |
|------|--------|------------|
| Fase 1 | Indices de banco (contatos + oportunidades) | CRITICA |
| Fase 2 | TanStack Query optimization | ALTA |
| Fase 3 | Code Splitting | ALTA |
| Fase 4 | Realtime Contatos | MEDIA |
| Fase 5 | RLS Optimization | MEDIA |

---

## Plano de Validacao

### Validacao Pre-Desenvolvimento

- [x] Diagnostico de performance atual
- [x] Analise de indices existentes
- [x] Verificacao de padroes TanStack Query
- [x] Mapeamento de imports estaticos

### Validacao Durante Desenvolvimento

- [ ] Query EXPLAIN mostra uso de indices
- [ ] Bundle size validado com `npm run build`
- [ ] Testes de navegacao em todas rotas
- [ ] Verificacao de Realtime no Supabase Dashboard

### Validacao Pos-Lancamento

- [ ] Metricas de tempo de carregamento
- [ ] Monitoramento de erros no Sentry
- [ ] Feedback de usuarios sobre velocidade
- [ ] Consumo de recursos no Supabase

---

## Implementacao Detalhada

### FASE 1: Indices de Banco (CRITICO)

**Prioridade:** MAXIMA
**Risco:** BAIXO (indices nao quebram funcionalidade)
**Impacto:** ALTO (queries 10-100x mais rapidas)

#### Migration: Indices para `contatos`

```sql
-- Migration: add_contatos_performance_indexes
-- AIDEV-NOTE: Usar CONCURRENTLY para nao travar tabela em producao

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_org_status
ON contatos(organizacao_id, status)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_org_owner
ON contatos(organizacao_id, owner_id)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_org_tipo
ON contatos(organizacao_id, tipo)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_org_criado
ON contatos(organizacao_id, criado_em DESC)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contatos_org_nome
ON contatos(organizacao_id, nome varchar_pattern_ops)
WHERE deletado_em IS NULL;
```

#### Migration: Indices para `oportunidades`

```sql
-- Migration: add_oportunidades_performance_indexes
-- AIDEV-NOTE: Usar CONCURRENTLY para nao travar tabela em producao

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_org_etapa
ON oportunidades(organizacao_id, etapa_funil_id)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_org_funil
ON oportunidades(organizacao_id, funil_id)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_org_owner
ON oportunidades(organizacao_id, owner_id)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_org_etapa_posicao
ON oportunidades(organizacao_id, etapa_funil_id, posicao)
WHERE deletado_em IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_oportunidades_org_status
ON oportunidades(organizacao_id, status)
WHERE deletado_em IS NULL;
```

#### Verificacao pos-deploy

```sql
-- Verificar se indices foram criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('contatos', 'oportunidades')
AND indexname LIKE 'idx_%';

-- Verificar uso dos indices (apos algumas horas)
SELECT
  schemaname, tablename, indexrelname,
  idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('contatos', 'oportunidades')
ORDER BY idx_scan DESC;
```

---

### FASE 2: TanStack Query Optimization

**Prioridade:** ALTA
**Risco:** BAIXO
**Impacto:** MEDIO

#### Corrigir staleTime do historico de emails

**Arquivo:** `src/modules/emails/hooks/useEmailHistorico.ts`

```typescript
// ANTES (linha 46)
staleTime: 30000, // 30 segundos - muito curto!

// DEPOIS
staleTime: 5 * 60 * 1000, // 5 minutos - historico nao muda frequentemente
```

#### Criar constantes de cache

**Arquivo:** `src/shared/constants/query-config.ts`

```typescript
/**
 * AIDEV-NOTE: Configuracoes padrao de cache por tipo de dado
 * Usar essas constantes em vez de valores hardcoded nos hooks
 */
export const QUERY_STALE_TIMES = {
  REAL_TIME: 30 * 1000,        // 30 segundos
  LIST: 60 * 1000,             // 1 minuto
  CONFIG: 5 * 60 * 1000,       // 5 minutos
  HISTORICAL: 10 * 60 * 1000,  // 10 minutos
  STATIC: 30 * 60 * 1000,      // 30 minutos
} as const

export const QUERY_GC_TIMES = {
  DEFAULT: 5 * 60 * 1000,      // 5 minutos
  EXTENDED: 30 * 60 * 1000,    // 30 minutos
} as const
```

---

### FASE 3: Code Splitting

**Prioridade:** ALTA
**Risco:** MEDIO (requer testes de navegacao)
**Impacto:** ALTO (reduz bundle inicial em 40-60%)

#### Criar componente LoadingSpinner

**Arquivo:** `src/shared/components/LoadingSpinner.tsx`

```typescript
interface LoadingSpinnerProps {
  fullScreen?: boolean
  text?: string
}

export function LoadingSpinner({ fullScreen, text = 'Carregando...' }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-sm text-muted-foreground">{text}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )
}
```

#### Implementar lazy loading em App.tsx

```typescript
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

// Auth (carrega sempre - rota inicial)
import { LoginPage, ForgotPasswordPage } from '@/modules/auth'

// Modulos lazy (carrega sob demanda)
const AppLayout = lazy(() => import('@/modules/app/layouts/AppLayout'))
const AppDashboardPage = lazy(() => import('@/modules/app/pages/DashboardPage'))
const ContatosPage = lazy(() => import('@/modules/contatos/pages/ContatosPage'))
const NegociosPage = lazy(() => import('@/modules/negocios/pages/NegociosPage'))
const FormulariosPage = lazy(() => import('@/modules/formularios/pages/FormulariosPage'))
const AutomacoesPage = lazy(() => import('@/modules/automacoes/pages/AutomacoesPage'))
const ConfiguracoesPage = lazy(() => import('@/modules/configuracoes/pages/ConfiguracoesPage'))
const AdminLayout = lazy(() => import('@/modules/admin/layouts/AdminLayout'))
```

---

### FASE 4: Realtime para Contatos

**Prioridade:** MEDIA
**Risco:** BAIXO
**Impacto:** MEDIO

#### Criar hook useContatosRealtime

**Arquivo:** `src/modules/contatos/hooks/useContatosRealtime.ts`

```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/hooks/useAuth'

/**
 * AIDEV-NOTE: Realtime subscription para contatos
 * Atualiza cache do TanStack Query quando contatos sao criados/atualizados/deletados
 */
export function useContatosRealtime() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const organizacaoId = user?.organizacao_id

  useEffect(() => {
    if (!organizacaoId) return

    const channel = supabase
      .channel(`contatos-realtime-${organizacaoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contatos',
          filter: `organizacao_id=eq.${organizacaoId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({
            queryKey: ['contatos', organizacaoId],
          })

          if (payload.eventType === 'UPDATE' && payload.new?.id) {
            queryClient.invalidateQueries({
              queryKey: ['contato', payload.new.id],
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizacaoId, queryClient])
}
```

---

### FASE 5: Otimizacao de RLS

**Prioridade:** MEDIA
**Risco:** MEDIO (requer testes de permissao)
**Impacto:** MEDIO

```sql
-- Migration: optimize_rls_super_admin_check

CREATE OR REPLACE FUNCTION is_super_admin_jwt()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'role') = 'super_admin',
    false
  )
$$;
```

---

## Regras de Seguranca para Deploy

### OBRIGATORIO antes de cada deploy:

1. **Backup**: Sempre ter backup recente antes de migrations
2. **Staging**: Testar em ambiente de staging primeiro (se disponivel)
3. **Horario**: Preferir deploys em horarios de baixo uso
4. **Rollback**: Ter script de rollback pronto para cada migration

### Para indices:

- **SEMPRE** usar `CONCURRENTLY` para nao travar tabelas
- Criar um indice por migration (facilita rollback)
- Monitorar uso com `pg_stat_user_indexes`

### Para code splitting:

- Testar **TODAS** as rotas apos deploy
- Verificar se lazy loading nao quebra deep links
- Manter Auth pages sem lazy (rota inicial)

### Para Realtime:

- Monitorar consumo no dashboard Supabase
- Implementar throttling se necessario
- Testar com multiplos usuarios simultaneos

---

## Checklist de Implementacao

### Fase 1: Indices (CRITICO) - Fazer PRIMEIRO
- [ ] Criar migration `add_contatos_performance_indexes`
- [ ] Criar migration `add_oportunidades_performance_indexes`
- [ ] Deploy em producao (CONCURRENTLY e seguro)
- [ ] Verificar criacao dos indices
- [ ] Monitorar uso apos 24h

### Fase 2: TanStack Query - Fazer SEGUNDO
- [ ] Corrigir staleTime em `useEmailHistorico.ts`
- [ ] Criar `src/shared/constants/query-config.ts`
- [ ] Revisar outros hooks com staleTime customizado
- [ ] Testar navegacao e cache

### Fase 3: Code Splitting - Fazer TERCEIRO
- [ ] Criar `LoadingSpinner.tsx`
- [ ] Converter imports para lazy em `App.tsx`
- [ ] Adicionar Suspense boundaries
- [ ] Testar navegacao entre modulos
- [ ] Verificar tamanho do bundle

### Fase 4: Realtime Contatos - Fazer QUARTO
- [ ] Criar `useContatosRealtime.ts`
- [ ] Integrar em `ContatosPage.tsx`
- [ ] Testar sincronizacao entre abas
- [ ] Verificar consumo de Realtime no Supabase

### Fase 5: RLS Optimization - Fazer POR ULTIMO
- [ ] Criar migration `optimize_rls_super_admin_check`
- [ ] Testar permissoes Super Admin
- [ ] Testar permissoes Admin/Member
- [ ] Monitorar latencia Realtime

---

## O que NAO fazer nesta fase

| Item | Motivo |
|------|--------|
| Redis Cache | Planejado para migracao self-hosted |
| CDN/Cloudflare | Futuro |
| Cursor Pagination | Offset funciona bem ate 100k rows |
| Sharding | Desnecessario para 300 usuarios |
| Read Replicas | Supabase Pro ja inclui |

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-02-20 | Equipe Tecnica | Versao inicial |

---

**Este documento faz parte do conjunto de PRDs do CRM Renove e deve ser consultado antes de implementar qualquer otimizacao de performance.**
