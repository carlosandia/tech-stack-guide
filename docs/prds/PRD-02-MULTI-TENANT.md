# PRD-02: Arquitetura Multi-Tenant - CRM Renove

| Campo | Valor |
|-------|-------|
| **Autor** | Arquiteto de Produto |
| **Data de criacao** | 2026-01-31 |
| **Ultima atualizacao** | 2026-02-03 |
| **Versao** | v1.2 |
| **Status** | Em desenvolvimento |
| **Dependencias** | PRD-01 |
| **Revisor tecnico** | Tech Lead |

---

## Resumo Executivo

Este documento define a arquitetura multi-tenant do CRM Renove, garantindo isolamento total de dados entre organizacoes (tenants) em uma infraestrutura compartilhada.

O modelo escolhido e **Shared Database with Row Level Security (RLS)**, onde todas as organizacoes compartilham o mesmo banco de dados, mas politicas de seguranca no nivel do PostgreSQL garantem que cada tenant so acesse seus proprios dados.

Esta arquitetura permite escalar para 1000+ tenants com custo operacional otimizado, mantendo seguranca e performance.

---

## Contexto e Motivacao

### Problema

#### Dores Atuais

- Empresas SaaS precisam atender multiplos clientes com dados isolados
- Cada cliente (tenant) deve ver apenas seus proprios dados
- Custo de infraestrutura precisa ser otimizado (nao um banco por cliente)
- Performance deve ser consistente mesmo com crescimento

#### Requisitos de Negocio

- Suportar 500-1000 tenants no primeiro ano
- Garantir isolamento total de dados entre organizacoes
- Permitir que Super Admin visualize dados de qualquer tenant
- Manter custo de infraestrutura controlado
- Facilitar backups e manutencao

### Oportunidade

**Beneficios do modelo multi-tenant:**
- Custo por tenant reduzido em 80% comparado a bancos isolados
- Operacao simplificada: um deploy, um backup, uma conexao
- Escalabilidade horizontal com Supabase
- Time-to-market acelerado para novos tenants

**Tendencias de mercado:**
- SaaS multi-tenant e padrao da industria
- PostgreSQL RLS e tecnologia madura e confiavel
- Supabase oferece RLS otimizado nativamente

### Alinhamento Estrategico

**Conexao com objetivos:**
- Habilitar modelo de negocios SaaS escalavel
- Garantir compliance com LGPD (isolamento de dados)
- Permitir pricing diferenciado por plano
- Base tecnica para crescimento 1000+ tenants

---

## Usuarios e Personas

### Super Admin (Operador da Plataforma)

**Necessidades neste modulo:**
- Criar e gerenciar organizacoes (tenants)
- Acessar dados de qualquer tenant para suporte
- Visualizar metricas consolidadas cross-tenant
- Configurar planos e limites por tenant

**Acoes permitidas:**
- CRUD completo em organizacoes_saas
- Bypass de RLS para suporte
- Acesso auditado a dados de tenants

### Admin (Gestor do Tenant)

**Necessidades neste modulo:**
- Operar apenas dentro do seu tenant
- Nao ver dados de outras organizacoes
- Confiar que RLS protege seus dados

**Restricoes:**
- Nunca acessa dados de outros tenants
- Nao pode alterar organizacao_id

### Member (Vendedor)

**Necessidades neste modulo:**
- Operar apenas dentro do seu tenant
- Nunca ver dados de outras organizacoes

**Restricoes:**
- Mesmas do Admin, porem com permissoes ainda mais limitadas

### Anti-Persona

**Atacante externo** - Pessoa que tenta explorar falhas de isolamento para acessar dados de outros tenants. RLS no banco impede esse vetor de ataque mesmo que aplicacao tenha bug.

---

## Hierarquia de Requisitos

### Theme (Objetivo Estrategico)

> Criar arquitetura multi-tenant segura, escalavel e economica para suportar 1000+ organizacoes com isolamento total de dados.

### Epic (Iniciativa)

> Implementar modelo Shared Database com Row Level Security garantindo isolamento a nivel de PostgreSQL.

### Features

**Feature 1: Isolamento de Dados**
- Coluna organizacao_id em todas tabelas CRM
- RLS habilitado em todas tabelas com organizacao_id
- Middleware que configura tenant no inicio de cada request

**Feature 2: Gestao de Tenants**
- CRUD de organizacoes_saas pelo Super Admin
- Criacao de Admin vinculado ao tenant
- Ativacao/suspensao de tenants

**Feature 3: Rate Limiting por Tenant**
- Limites configuraveis por plano
- Middleware que aplica throttling por organizacao_id
- Metricas de uso por tenant

**Feature 4: Auditoria Cross-Tenant**
- Log de acesso do Super Admin a dados de tenants
- Correlation ID para rastreabilidade
- Historico completo de operacoes

---

## Modelo de Multi-Tenancy Escolhido

### Shared Database + Row Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Tenant A   │  │  Tenant B   │  │  Tenant C   │  ...    │
│  │ org_id: 111 │  │ org_id: 222 │  │ org_id: 333 │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  Todas as tabelas compartilhadas                            │
│  RLS garante isolamento                                     │
│  organizacao_id em TODAS as tabelas CRM                     │
└─────────────────────────────────────────────────────────────┘
```

### Por Que Este Modelo?

| Modelo | Isolamento | Custo | Complexidade | Escolha |
|--------|------------|-------|--------------|---------|
| Database-per-tenant | Alto | Alto | Alta | Nao |
| Schema-per-tenant | Medio | Medio | Media | Nao |
| **Shared + RLS** | **Alto** | **Baixo** | **Baixa** | **SIM** |

**Justificativa:**
- RLS do PostgreSQL oferece isolamento a nivel de banco (nao depende de app)
- Custo otimizado: um banco, uma conexao, um backup
- Supabase ja oferece RLS nativo e otimizado
- Facilita queries cross-tenant para Super Admin
- Escala horizontalmente com Supabase

---

## Arquitetura de Dados

### Separacao de Mundos

O sistema possui dois "mundos" de dados que NUNCA devem se misturar:

#### Mundo SaaS (Plataforma)

Tabelas que gerenciam a propria plataforma:

```
organizacoes_saas    → Tenants (empresas clientes do SaaS)
usuarios             → Usuarios de todos os tenants
papeis               → Roles (Super Admin, Admin, Member)
permissoes           → Permissoes por papel
configuracoes_globais → Config de Meta, Google (Super Admin)
assinaturas_saas     → Planos e billing (futuro)
```

**Regra:** Essas tabelas sao gerenciadas pelo **Super Admin**.

#### Mundo CRM (Dados do Cliente)

Tabelas que armazenam dados de cada tenant:

```
contatos             → Base de contatos
contatos_pessoas     → Extensao para pessoas
contatos_empresas    → Extensao para empresas
oportunidades        → Negocios no funil
funis                → Pipelines de vendas
etapas_funil         → Etapas de cada funil
tarefas              → Tarefas e follow-ups
campos_customizados  → Campos dinamicos
produtos             → Catalogo de produtos
... (todas com organizacao_id)
```

**Regra:** Essas tabelas sao acessadas por **Admin** e **Member** do tenant.

---

## Implementacao do Isolamento

### Coluna organizacao_id

**TODAS** as tabelas do Mundo CRM devem ter:

```sql
CREATE TABLE exemplo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  -- outros campos
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  deletado_em timestamptz
);
```

### Row Level Security (RLS)

Toda tabela com `organizacao_id` deve ter politica RLS:

```sql
-- Habilitar RLS
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- Politica para SELECT
CREATE POLICY "tenant_isolation_select" ON oportunidades
  FOR SELECT
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica para INSERT
CREATE POLICY "tenant_isolation_insert" ON oportunidades
  FOR INSERT
  WITH CHECK (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica para UPDATE
CREATE POLICY "tenant_isolation_update" ON oportunidades
  FOR UPDATE
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);

-- Politica para DELETE (soft delete)
CREATE POLICY "tenant_isolation_delete" ON oportunidades
  FOR DELETE
  USING (organizacao_id = current_setting('app.current_tenant')::uuid);
```

### Configuracao do Tenant no Request

O backend deve configurar o tenant no inicio de cada request:

```typescript
// Middleware Express
app.use(async (req, res, next) => {
  const tenantId = req.user?.organizacao_id;

  if (tenantId) {
    // Configura tenant no PostgreSQL para RLS
    await supabase.rpc('set_current_tenant', { tenant_id: tenantId });
  }

  next();
});
```

```sql
-- Funcao no Supabase
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant', tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Indices para Performance

### Indices Compostos Obrigatorios

Queries por `organizacao_id` isolado NAO escalam. Sempre use indices compostos:

```sql
-- CORRETO: Indice composto
CREATE INDEX idx_oportunidades_tenant_status
  ON oportunidades(organizacao_id, status);

CREATE INDEX idx_oportunidades_tenant_etapa
  ON oportunidades(organizacao_id, etapa_id);

CREATE INDEX idx_contatos_tenant_email
  ON contatos(organizacao_id, email);

CREATE INDEX idx_contatos_tenant_telefone
  ON contatos(organizacao_id, telefone);

-- INCORRETO: Indice simples (nao usar)
CREATE INDEX idx_oportunidades_tenant
  ON oportunidades(organizacao_id);
```

### Indice Parcial para Soft Delete

```sql
-- Indice que ignora registros deletados
CREATE INDEX idx_oportunidades_ativas
  ON oportunidades(organizacao_id, status)
  WHERE deletado_em IS NULL;
```

---

## Fluxo de Criacao de Tenant

### Passo a Passo

```
1. Super Admin acessa painel
2. Clica em "Nova Organizacao"
3. Preenche dados da empresa
4. Sistema cria registro em organizacoes_saas
5. Super Admin cria primeiro Admin do tenant
6. Sistema cria usuario com role Admin
7. Admin recebe email de boas-vindas
8. Admin faz login e configura o CRM
```

### Dados Minimos do Tenant

```typescript
interface OrganizacaoSaas {
  id: uuid;
  nome: string;              // Nome da empresa
  slug: string;              // Identificador unico (URL-friendly)
  segmento: string;          // Segmento de mercado
  website?: string;
  telefone?: string;
  email: string;             // Email principal
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  plano: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'ativo' | 'suspenso' | 'cancelado';
  criado_em: timestamp;
  atualizado_em: timestamp;
}
```

---

## Acesso Cross-Tenant (Super Admin)

O Super Admin precisa visualizar dados de qualquer tenant para suporte.

### Implementacao

```sql
-- Politica especial para Super Admin
CREATE POLICY "super_admin_full_access" ON oportunidades
  FOR ALL
  USING (
    current_setting('app.current_tenant', true) IS NULL
    OR organizacao_id = current_setting('app.current_tenant')::uuid
    OR EXISTS (
      SELECT 1 FROM usuarios u
      JOIN papeis p ON u.papel_id = p.id
      WHERE u.id = current_setting('app.current_user')::uuid
      AND p.nome = 'super_admin'
    )
  );
```

### Auditoria de Acesso Cross-Tenant

Todo acesso de Super Admin a dados de tenant deve ser logado:

```sql
INSERT INTO audit_log (
  usuario_id,
  organizacao_id,
  acao,
  entidade,
  descricao,
  ip
) VALUES (
  current_setting('app.current_user')::uuid,
  tenant_acessado_id,
  'cross_tenant_access',
  'oportunidades',
  'Super Admin acessou dados do tenant para suporte',
  request_ip
);
```

---

## Limites por Tenant

### Rate Limiting

| Plano | Requests/min | Requests/dia | Storage |
|-------|--------------|--------------|---------|
| Trial | 30 | 500 | 100MB |
| Starter | 60 | 2.000 | 1GB |
| Pro | 300 | 10.000 | 10GB |
| Enterprise | 1.000 | 100.000 | 100GB |

### Implementacao de Rate Limit

```typescript
// Middleware de rate limiting por tenant
const rateLimiter = rateLimit({
  keyGenerator: (req) => req.user?.organizacao_id || req.ip,
  windowMs: 60 * 1000, // 1 minuto
  max: async (req) => {
    const plano = await getTenantPlano(req.user?.organizacao_id);
    return RATE_LIMITS[plano].requests_per_minute;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Limite de requisicoes excedido. Tente novamente em breve.',
      retry_after: 60
    });
  }
});
```

---

## Rastreabilidade com Correlation ID

### Visao Geral

O `correlation_id` e um identificador unico (UUID) gerado no inicio de cada request HTTP. Ele permite rastrear todas as operacoes relacionadas a um mesmo request atraves de multiplas camadas (API, banco, logs, filas).

### Por Que Usar Correlation ID?

| Problema | Solucao com Correlation ID |
|----------|---------------------------|
| Request gera multiplas queries, como correlacionar? | Mesmo correlation_id em todas queries |
| Erro em producao, como debugar? | Buscar correlation_id nos logs |
| Webhook dispara acoes em cascata | Propagar correlation_id entre servicos |
| Audit log, como agrupar acoes? | Filtrar por correlation_id |

### Implementacao

**1. Middleware de Geracao (Backend)**

```typescript
// Middleware Express para gerar correlation_id
import { v4 as uuidv4 } from 'uuid';

app.use((req, res, next) => {
  // Usa header existente ou gera novo
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();

  // Propaga para response
  res.setHeader('x-correlation-id', req.correlationId);

  // Configura no PostgreSQL para queries
  // (alem do tenant_id ja configurado)
  next();
});
```

**2. Configuracao no PostgreSQL**

```sql
-- Funcao para configurar correlation_id na sessao
CREATE OR REPLACE FUNCTION set_correlation_id(corr_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.correlation_id', corr_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uso no middleware apos set_current_tenant
await supabase.rpc('set_correlation_id', { corr_id: req.correlationId });
```

**3. Uso no Audit Log**

```sql
-- Audit log ja possui coluna correlation_id
INSERT INTO audit_log (
  organizacao_id,
  usuario_id,
  correlation_id,  -- ← Aqui
  acao,
  entidade,
  entidade_id
) VALUES (
  current_setting('app.current_tenant')::uuid,
  current_setting('app.current_user')::uuid,
  current_setting('app.correlation_id')::uuid,  -- ← Captura automaticamente
  'update',
  'oportunidades',
  oportunidade_id
);
```

**4. Propagacao para Servicos Externos**

```typescript
// Ao chamar APIs externas ou webhooks, propagar correlation_id
await axios.post(webhookUrl, payload, {
  headers: {
    'x-correlation-id': req.correlationId,
    'Content-Type': 'application/json'
  }
});
```

**5. Logs Estruturados**

```typescript
// Winston logger com correlation_id
logger.info('Oportunidade atualizada', {
  correlationId: req.correlationId,
  tenantId: req.user.organizacao_id,
  userId: req.user.id,
  oportunidadeId: oportunidade.id,
  etapaAnterior: anterior.etapa_id,
  etapaNova: nova.etapa_id
});
```

### Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DO CORRELATION ID                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Request chega no backend                                                │
│     └─> Middleware gera: correlation_id = "abc-123"                         │
│                                                                             │
│  2. Configura sessao PostgreSQL                                             │
│     └─> set_current_tenant('tenant-uuid')                                   │
│     └─> set_correlation_id('abc-123')                                       │
│                                                                             │
│  3. Operacoes no banco                                                      │
│     └─> UPDATE oportunidades SET etapa_id = ...                             │
│     └─> INSERT INTO audit_log (correlation_id = 'abc-123', ...)             │
│     └─> INSERT INTO tarefas (...)                                           │
│     └─> INSERT INTO audit_log (correlation_id = 'abc-123', ...)             │
│                                                                             │
│  4. Dispara webhook                                                         │
│     └─> POST /webhook { headers: { 'x-correlation-id': 'abc-123' } }        │
│                                                                             │
│  5. Log de response                                                         │
│     └─> logger.info('Request finalizado', { correlationId: 'abc-123' })     │
│                                                                             │
│  6. Response para cliente                                                   │
│     └─> Header: x-correlation-id: abc-123                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Beneficios para Debugging

```sql
-- Buscar todas operacoes de um request com problema
SELECT
  acao,
  entidade,
  entidade_id,
  dados_novos,
  criado_em
FROM audit_log
WHERE correlation_id = 'abc-123'
ORDER BY criado_em ASC;

-- Resultado: todas as acoes do mesmo request em ordem cronologica
```

---

## Backup e Recuperacao

### Estrategia de Backup

- **Full backup:** Diario as 3h (Supabase automatico)
- **Point-in-time recovery:** Ultimos 7 dias
- **Retencao:** 30 dias

### Recuperacao por Tenant

Em caso de necessidade de restaurar dados de um tenant especifico:

```sql
-- 1. Identificar dados do tenant no backup
-- 2. Restaurar para tabela temporaria
-- 3. Inserir de volta na tabela principal com organizacao_id

INSERT INTO oportunidades
SELECT * FROM oportunidades_backup
WHERE organizacao_id = 'tenant-uuid'
AND criado_em > '2026-01-01';
```

---

## Requisitos Funcionais

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF-001 | Toda tabela CRM deve ter coluna organizacao_id | Must |
| RF-002 | RLS deve estar ativo em todas tabelas com organizacao_id | Must |
| RF-003 | Queries sem tenant devem falhar (exceto Super Admin) | Must |
| RF-004 | Super Admin pode acessar qualquer tenant | Must |
| RF-005 | Acesso cross-tenant deve ser auditado | Must |
| RF-006 | Rate limiting deve ser por tenant | Should |
| RF-007 | Limites devem variar por plano | Should |

---

## Requisitos Nao-Funcionais

| Requisito | Target |
|-----------|--------|
| Isolamento | 100% (nenhum vazamento de dados entre tenants) |
| Performance com 1000 tenants | < 200ms P95 |
| Tempo de criacao de tenant | < 5 segundos |
| Backup recovery time | < 4 horas |

---

## Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Vazamento de dados entre tenants | Baixa | Critico | RLS no banco, testes automatizados |
| Query sem filtro de tenant | Media | Alto | Linter customizado, code review |
| Performance degradada | Media | Medio | Indices compostos, monitoring |
| Tenant "noisy neighbor" | Media | Medio | Rate limiting por tenant |

---

## Escopo

### O que ESTA no escopo

- Modelo Shared Database com RLS
- Coluna organizacao_id em todas tabelas CRM
- Politicas RLS para SELECT, INSERT, UPDATE, DELETE
- Funcao set_current_tenant para configurar sessao
- Middleware de tenant no backend
- Indices compostos para performance
- Rate limiting basico por tenant
- Auditoria de acesso cross-tenant
- Correlation ID para rastreabilidade

### O que NAO esta no escopo (v1)

- Database-per-tenant ou schema-per-tenant
- Sharding horizontal de dados
- Multi-regiao (todos dados em uma regiao)
- Billing automatizado por uso
- Self-service para criacao de tenants (via Super Admin apenas)
- Migracao de dados entre tenants

### Escopo Futuro (v2+)

- Portal self-service para criacao de tenants
- Sharding por volume de dados
- Multi-regiao para compliance geografico
- Billing automatizado por consumo
- Export de dados por tenant (LGPD)

---

## Metricas de Sucesso

### KPIs Primarios

| Metrica | Baseline | Meta | Prazo |
|---------|----------|------|-------|
| Vazamentos de dados entre tenants | 0 | 0 | Sempre |
| Tempo de query P95 (com 100 tenants) | - | < 100ms | 30 dias |
| Tempo de query P95 (com 1000 tenants) | - | < 200ms | 6 meses |
| Uptime do isolamento | - | 99.99% | Continuo |

### KPIs Secundarios

| Metrica | Meta |
|---------|------|
| Tempo de criacao de tenant | < 5 segundos |
| Cobertura de testes de isolamento | > 95% |
| Audit logs por acesso cross-tenant | 100% |
| Tenants ativos monitorados | 100% |

### Criterios de Lancamento

- [ ] RLS habilitado em 100% das tabelas CRM
- [ ] Testes de isolamento passando (100%)
- [ ] Middleware de tenant implementado
- [ ] Rate limiting basico funcionando
- [ ] Audit log de cross-tenant ativo
- [ ] Zero vazamentos em testes de penetracao

---

## Time to Value (TTV)

### MVP (Dias 1-3)

**Objetivo:** Isolamento funcional basico

| Dia | Entrega |
|-----|---------|
| Dia 1 | Tabela organizacoes_saas + funcao set_current_tenant |
| Dia 2 | RLS em tabelas core (contatos, oportunidades, funis) |
| Dia 3 | Middleware de tenant no backend + testes basicos |

**Criterio de sucesso:** Tenant A nao consegue ver dados do Tenant B.

### V1.0 (Dias 4-5)

**Objetivo:** Rate limiting e auditoria

| Dia | Entrega |
|-----|---------|
| Dia 4 | Rate limiting por tenant + indices compostos |
| Dia 5 | Audit log cross-tenant + correlation ID |

**Criterio de sucesso:** Sistema pronto para multiplos tenants em producao.

---

## Plano de Validacao

### Pre-Lancamento

| Validacao | Metodo | Responsavel |
|-----------|--------|-------------|
| Testes de isolamento | Suite automatizada Jest | Backend Dev |
| Revisao de RLS | Auditoria manual de politicas | Tech Lead |
| Teste de penetracao | Tentativa de acesso cross-tenant | QA |
| Performance baseline | Load test com 10 tenants | DevOps |

### Durante Lancamento

| Validacao | Metodo | Responsavel |
|-----------|--------|-------------|
| Monitoramento de queries | Logs Supabase | DevOps |
| Alertas de erro RLS | Sentry + alertas | Backend Dev |
| Metricas de latencia | Dashboard Grafana | DevOps |

### Pos-Lancamento

| Validacao | Metodo | Frequencia |
|-----------|--------|------------|
| Teste de isolamento regressivo | CI/CD automatico | Todo deploy |
| Auditoria de audit_log | Revisao manual | Semanal |
| Performance com crescimento | Load test | Mensal |
| Revisao de politicas RLS | Checklist | Trimestral |

---

## Testes de Isolamento

### Testes Automatizados Obrigatorios

```typescript
describe('Multi-Tenant Isolation', () => {
  it('deve impedir acesso a dados de outro tenant', async () => {
    // Criar oportunidade no tenant A
    const oppTenantA = await createOportunidade(tenantAId);

    // Tentar acessar do tenant B
    const result = await getOportunidade(oppTenantA.id, tenantBId);

    expect(result).toBeNull();
  });

  it('deve permitir Super Admin acessar qualquer tenant', async () => {
    const oppTenantA = await createOportunidade(tenantAId);

    // Acessar como Super Admin
    const result = await getOportunidadeAsSuperAdmin(oppTenantA.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(oppTenantA.id);
  });
});
```

---

## Checklist de Implementacao

- [ ] Criar tabela organizacoes_saas
- [ ] Adicionar organizacao_id em todas tabelas CRM
- [ ] Habilitar RLS em todas tabelas com organizacao_id
- [ ] Criar politicas RLS (SELECT, INSERT, UPDATE, DELETE)
- [ ] Implementar funcao set_current_tenant
- [ ] Criar middleware de tenant no backend
- [ ] Implementar indices compostos
- [ ] Configurar rate limiting por tenant
- [ ] Criar testes de isolamento
- [ ] Documentar processo de criacao de tenant

---

## Historico de Versoes

| Versao | Data | Autor | Mudancas |
|--------|------|-------|----------|
| v1.0 | 2026-01-31 | Arquiteto de Produto | Versao inicial |
| v1.1 | 2026-02-01 | Arquiteto de Produto | Adicionada secao Rastreabilidade com Correlation ID: geracao, propagacao, integracao com audit_log |
| v1.2 | 2026-02-03 | Arquiteto de Produto | Adicionado: Contexto completo, Usuarios/Personas, Hierarquia de Requisitos, Escopo, Metricas de Sucesso, TTV, Plano de Validacao |
