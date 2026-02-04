# Validator - Guia de Validacao de Backend

| Campo | Valor |
|-------|-------|
| **Versao** | v1.0 |
| **Data de criacao** | 2026-02-04 |
| **Ultima atualizacao** | 2026-02-04 |
| **Autor** | Arquiteto de Produto |
| **Status** | Ativo |

---

## Proposito

Este documento serve como guia definitivo para validar implementacoes de backend do CRM Renove. Inclui:
- Checklists por nivel de prioridade
- Scripts SQL prontos para executar via Supabase MCP
- Validacoes por PRD
- Matriz de permissoes por role

**IMPORTANTE**: Use este documento ANTES de considerar qualquer PRD como "implementado".

---

## Como Usar com Supabase MCP

### Ferramentas Disponiveis

| Ferramenta MCP | Proposito |
|----------------|-----------|
| `mcp__supabase__execute_sql` | Executar queries SQL de validacao |
| `mcp__supabase__get_advisors` | Verificar issues de seguranca/performance |
| `mcp__supabase__list_tables` | Listar tabelas e verificar RLS |
| `mcp__supabase__list_migrations` | Verificar migrations aplicadas |
| `mcp__supabase__get_logs` | Debugar erros em tempo real |

### Fluxo de Validacao Recomendado

```
1. Executar get_advisors → Corrigir issues ANTES de continuar
2. Executar queries de seguranca (RLS)
3. Validar schema (tabelas, colunas, FKs)
4. Testar isolamento de tenant
5. Validar endpoints API
6. Rodar testes automatizados
```

---

## Piramide de Validacao (Ordem de Prioridade)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIORIDADE DE VALIDACAO                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   P1 ████████████████████████████████████████  SEGURANCA        │
│      RLS, Isolamento tenant, Funcoes seguras                    │
│                                                                  │
│   P2 ██████████████████████████████  AUTENTICACAO               │
│      JWT, Roles, Permissoes, Super Admin                        │
│                                                                  │
│   P3 ████████████████████████  SCHEMA                           │
│      Tabelas, Colunas, FKs, Constraints, organizacao_id         │
│                                                                  │
│   P4 ██████████████████  VALIDACAO DE DADOS                     │
│      Zod schemas, Tipos, Inputs                                 │
│                                                                  │
│   P5 ████████████████  API                                      │
│      Endpoints, Status codes, Contratos                         │
│                                                                  │
│   P6 ██████████  INTEGRACAO                                     │
│      Services, Fluxos E2E                                       │
│                                                                  │
│   P7 ██████  PERFORMANCE                                        │
│      Indices, Queries otimizadas                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## P1: Validacao de Seguranca (CRITICO)

### 1.1 Verificar RLS em Todas Tabelas

**Objetivo**: Garantir que TODAS as tabelas com dados de tenant tenham RLS habilitado.

```sql
-- Query: Listar status de RLS por tabela
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ OK'
    ELSE '❌ FALHA - RLS DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity ASC, tablename;
```

**Resultado Esperado**: Todas tabelas com `rls_enabled = true`

### 1.2 Listar Tabelas SEM RLS (Critico)

```sql
-- Query: Tabelas publicas SEM RLS (problema de seguranca)
SELECT
  tablename as tabela,
  '🚨 CRITICO: Habilitar RLS imediatamente' as acao
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
```

**Acao Obrigatoria**: Se retornar linhas, habilitar RLS:
```sql
ALTER TABLE public.nome_tabela ENABLE ROW LEVEL SECURITY;
```

### 1.3 Verificar Policies de RLS Existentes

```sql
-- Query: Listar todas policies de RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 1.4 Verificar Funcoes com search_path Mutavel

```sql
-- Query: Funcoes com search_path inseguro
SELECT
  n.nspname as schema,
  p.proname as funcao,
  '⚠️ search_path mutavel - corrigir' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT (p.proconfig @> ARRAY['search_path=public']);
```

**Correcao**:
```sql
ALTER FUNCTION public.nome_funcao() SET search_path = public;
```

### 1.5 Testar Isolamento de Tenant

```sql
-- Query: Verificar que todas tabelas CRM tem organizacao_id
SELECT
  table_name as tabela,
  CASE
    WHEN column_name IS NOT NULL THEN '✅ OK'
    ELSE '❌ FALHA - Sem organizacao_id'
  END as status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND c.column_name = 'organizacao_id'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN (
    'papeis', 'modulos', 'planos', 'planos_modulos',
    'configuracoes_globais', 'audit_log'
  )
ORDER BY status DESC, table_name;
```

### 1.6 Usar Supabase Advisors

Execute via MCP:
```
mcp__supabase__get_advisors com type: "security"
```

**Issues Criticos a Corrigir**:
- `rls_disabled_in_public` → Habilitar RLS
- `function_search_path_mutable` → Fixar search_path
- `auth_leaked_password_protection` → Habilitar protecao

---

## P2: Validacao de Autenticacao

### 2.1 Verificar Usuario Super Admin Existe

```sql
-- Query: Validar Super Admin pre-criado
SELECT
  id,
  email,
  role,
  status,
  CASE
    WHEN email = 'superadmin@renovedigital.com.br'
      AND role = 'super_admin'
      AND status = 'ativo'
    THEN '✅ Super Admin OK'
    ELSE '❌ FALHA - Super Admin invalido'
  END as validacao
FROM usuarios
WHERE role = 'super_admin';
```

**Resultado Esperado**: 1 linha com email `superadmin@renovedigital.com.br`

### 2.2 Verificar Hierarquia de Roles

```sql
-- Query: Validar papeis existentes
SELECT
  nome,
  nivel,
  CASE
    WHEN nome = 'super_admin' AND nivel = 100 THEN '✅'
    WHEN nome = 'admin' AND nivel = 50 THEN '✅'
    WHEN nome = 'member' AND nivel = 10 THEN '✅'
    ELSE '❌'
  END as status
FROM papeis
ORDER BY nivel DESC;
```

### 2.3 Verificar Refresh Tokens

```sql
-- Query: Tokens nao expirados por usuario
SELECT
  u.email,
  COUNT(rt.id) as tokens_ativos,
  MAX(rt.expira_em) as expira_em
FROM usuarios u
LEFT JOIN refresh_tokens rt
  ON u.id = rt.usuario_id
  AND rt.revogado_em IS NULL
  AND rt.expira_em > NOW()
GROUP BY u.id, u.email
ORDER BY tokens_ativos DESC;
```

---

## P3: Validacao de Schema

### 3.1 Verificar Tabelas por PRD

```sql
-- Query: Contagem de tabelas por PRD (baseado em comments)
SELECT
  COALESCE(
    REGEXP_REPLACE(obj_description(c.oid), '^(PRD-\d+):.*', '\1'),
    'Sem PRD'
  ) as prd,
  COUNT(*) as total_tabelas,
  STRING_AGG(c.relname, ', ' ORDER BY c.relname) as tabelas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
GROUP BY 1
ORDER BY 1;
```

### 3.2 Verificar Foreign Keys

```sql
-- Query: Listar todas FKs
SELECT
  tc.table_name as tabela,
  kcu.column_name as coluna,
  ccu.table_name as referencia_tabela,
  ccu.column_name as referencia_coluna
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### 3.3 Verificar Constraints de Check

```sql
-- Query: Listar constraints de validacao
SELECT
  table_name as tabela,
  constraint_name,
  check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc
  ON cc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY table_name, constraint_name;
```

### 3.4 Verificar Indices

```sql
-- Query: Listar indices por tabela
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## P4: Validacao de Dados

### 4.1 Verificar Planos Seed

```sql
-- Query: Planos devem existir
SELECT
  nome,
  preco_mensal,
  limite_usuarios,
  ativo,
  CASE
    WHEN nome IN ('trial', 'starter', 'pro', 'enterprise') THEN '✅'
    ELSE '⚠️'
  END as status
FROM planos
ORDER BY ordem;
```

**Resultado Esperado**: 4 planos (trial, starter, pro, enterprise)

### 4.2 Verificar Modulos Seed

```sql
-- Query: Modulos base devem existir
SELECT
  slug,
  nome,
  obrigatorio,
  CASE
    WHEN slug IN ('crm', 'configuracoes', 'contatos', 'negocios',
                  'conversas', 'tarefas', 'relatorios', 'integracoes')
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM modulos
ORDER BY ordem;
```

### 4.3 Verificar Configuracoes Globais

```sql
-- Query: Plataformas de integracao configuradas
SELECT
  plataforma,
  configurado,
  ultimo_teste,
  CASE
    WHEN plataforma IN ('smtp', 'whatsapp', 'meta_ads',
                        'google', 'instagram', 'email')
    THEN '✅'
    ELSE '⚠️'
  END as status
FROM configuracoes_globais
ORDER BY plataforma;
```

---

## P5: Validacao de API

### 5.1 Endpoints Esperados por PRD

#### PRD-03: Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login com email/senha |
| POST | `/api/auth/logout` | Logout e revoga tokens |
| POST | `/api/auth/refresh` | Renovar access token |
| POST | `/api/auth/forgot-password` | Solicitar reset de senha |
| POST | `/api/auth/reset-password` | Executar reset de senha |
| GET | `/api/auth/me` | Dados do usuario logado |

#### PRD-05: Configuracoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/campos` | Listar campos customizados |
| POST | `/api/campos` | Criar campo customizado |
| PUT | `/api/campos/:id` | Atualizar campo |
| DELETE | `/api/campos/:id` | Deletar campo (soft) |
| GET | `/api/produtos` | Listar produtos |
| POST | `/api/produtos` | Criar produto |
| GET | `/api/etapas-templates` | Listar etapas |
| GET | `/api/tarefas-templates` | Listar templates de tarefas |
| GET | `/api/motivos` | Listar motivos ganho/perda |
| GET | `/api/regras` | Listar regras qualificacao |
| GET | `/api/webhooks` | Listar webhooks |
| GET | `/api/equipe` | Listar membros da equipe |
| GET | `/api/metas` | Listar metas |

#### PRD-14: Super Admin

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/admin/organizacoes` | Listar tenants |
| POST | `/api/admin/organizacoes` | Criar tenant |
| GET | `/api/admin/organizacoes/:id` | Detalhes do tenant |
| POST | `/api/admin/organizacoes/:id/usuarios` | Criar Admin no tenant |
| GET | `/api/admin/planos` | Listar planos |
| GET | `/api/admin/metricas` | Metricas globais |
| GET | `/api/admin/configuracoes-globais` | Config globais |
| PUT | `/api/admin/configuracoes-globais/:plataforma` | Atualizar config |

### 5.2 Validar Status Codes

| Cenario | Status Esperado |
|---------|-----------------|
| Sucesso leitura | 200 OK |
| Sucesso criacao | 201 Created |
| Sem conteudo | 204 No Content |
| Input invalido | 400 Bad Request |
| Nao autenticado | 401 Unauthorized |
| Sem permissao | 403 Forbidden |
| Nao encontrado | 404 Not Found |
| Erro servidor | 500 Internal Server Error |

---

## P6: Validacao de Integracao

### 6.1 Teste de Fluxo: Criar Tenant

```
1. POST /api/admin/organizacoes (Super Admin)
   → Deve criar organizacao em organizacoes_saas
   → Deve criar configuracoes_tenant automaticamente

2. POST /api/admin/organizacoes/:id/usuarios (Super Admin)
   → Deve criar usuario com role=admin
   → Deve vincular ao tenant criado

3. Login como Admin criado
   → JWT deve conter tenant_id e role=admin

4. GET /api/campos (Admin)
   → Deve retornar apenas campos do seu tenant
```

### 6.2 Teste de Isolamento de Tenant

```
1. Criar 2 tenants (Tenant A, Tenant B)
2. Criar Admin em cada tenant
3. Admin A cria campo customizado
4. Admin B tenta acessar campos
   → Deve retornar APENAS campos do Tenant B (vazio ou proprios)
   → NAO pode ver campos do Tenant A
```

---

## P7: Validacao de Performance

### 7.1 Verificar Indices Compostos

```sql
-- Query: Indices compostos com organizacao_id
SELECT
  tablename,
  indexname,
  indexdef,
  CASE
    WHEN indexdef LIKE '%organizacao_id%' THEN '✅ Otimizado'
    ELSE '⚠️ Verificar'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'organizacao_id'
  )
ORDER BY tablename;
```

### 7.2 Queries Lentas (via logs)

Execute via MCP:
```
mcp__supabase__get_logs com service: "postgres"
```

Buscar por: `duration: XXXms` onde XXX > 100

---

## Validacao por PRD

### PRD-01: Visao do Produto
- [x] Documento de visao existe em `docs/prds/PRD-01-VISAO-PRODUTO.md`
- [x] Personas definidas
- [x] Diferenciais documentados

**Sem validacao de backend** (documento apenas)

---

### PRD-02: Multi-Tenant

**Checklist**:
- [ ] Todas tabelas CRM tem `organizacao_id`
- [ ] RLS habilitado em tabelas com tenant
- [ ] FK para `organizacoes_saas` existe

**Query de Validacao**:
```sql
-- Validar PRD-02: Multi-Tenant
SELECT
  t.table_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌' END as tem_org_id,
  CASE WHEN pt.rowsecurity THEN '✅' ELSE '❌' END as tem_rls
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND c.column_name = 'organizacao_id'
LEFT JOIN pg_tables pt
  ON pt.tablename = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT IN ('papeis', 'modulos', 'planos', 'planos_modulos',
                           'configuracoes_globais', 'audit_log')
ORDER BY t.table_name;
```

---

### PRD-03: Autenticacao

**Checklist**:
- [ ] Tabela `usuarios` existe com campos corretos
- [ ] Tabela `refresh_tokens` existe
- [ ] Super Admin seed existe
- [ ] Roles (super_admin, admin, member) definidos
- [ ] Endpoints de auth funcionando

**Query de Validacao**:
```sql
-- Validar PRD-03: Autenticacao
SELECT
  'usuarios' as verificacao,
  CASE WHEN EXISTS(SELECT 1 FROM usuarios WHERE role = 'super_admin')
    THEN '✅ Super Admin existe'
    ELSE '❌ Super Admin NAO existe'
  END as status
UNION ALL
SELECT
  'papeis',
  CASE WHEN (SELECT COUNT(*) FROM papeis) = 3
    THEN '✅ 3 roles definidos'
    ELSE '❌ Roles incorretos'
  END
UNION ALL
SELECT
  'refresh_tokens',
  CASE WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'refresh_tokens')
    THEN '✅ Tabela existe'
    ELSE '❌ Tabela NAO existe'
  END;
```

---

### PRD-04: Database Schema

**Checklist**:
- [ ] Tabela `organizacoes_saas` existe
- [ ] Tabela `usuarios` com FK para organizacoes
- [ ] Tabela `perfis_permissao` existe
- [ ] Audit log configurado

**Query de Validacao**:
```sql
-- Validar PRD-04: Schema Base
SELECT
  table_name,
  '✅ Existe' as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'organizacoes_saas', 'usuarios', 'perfis_permissao',
    'papeis', 'audit_log', 'refresh_tokens'
  )
ORDER BY table_name;
```

---

### PRD-05: Configuracoes

**Checklist**:
- [ ] `campos_customizados` existe
- [ ] `valores_campos_customizados` existe
- [ ] `categorias_produtos` existe
- [ ] `produtos` existe
- [ ] `motivos_resultado` existe
- [ ] `tarefas_templates` existe
- [ ] `etapas_templates` existe
- [ ] `etapas_tarefas` existe
- [ ] `regras_qualificacao` existe
- [ ] `configuracoes_card` existe
- [ ] `webhooks_entrada` existe
- [ ] `webhooks_saida` existe
- [ ] `webhooks_saida_logs` existe
- [ ] `equipes` existe
- [ ] `equipes_membros` existe
- [ ] `metas` existe
- [ ] `metas_progresso` existe
- [ ] `configuracoes_tenant` existe

**Query de Validacao**:
```sql
-- Validar PRD-05: Configuracoes (18 tabelas)
SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'campos_customizados', 'valores_campos_customizados',
      'categorias_produtos', 'produtos', 'motivos_resultado',
      'tarefas_templates', 'etapas_templates', 'etapas_tarefas',
      'regras_qualificacao', 'configuracoes_card',
      'webhooks_entrada', 'webhooks_saida', 'webhooks_saida_logs',
      'equipes', 'equipes_membros', 'metas', 'metas_progresso',
      'configuracoes_tenant'
    ) THEN '✅'
    ELSE '⚠️'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'campos_customizados', 'valores_campos_customizados',
    'categorias_produtos', 'produtos', 'motivos_resultado',
    'tarefas_templates', 'etapas_templates', 'etapas_tarefas',
    'regras_qualificacao', 'configuracoes_card',
    'webhooks_entrada', 'webhooks_saida', 'webhooks_saida_logs',
    'equipes', 'equipes_membros', 'metas', 'metas_progresso',
    'configuracoes_tenant'
  )
ORDER BY table_name;
```

**Contagem Esperada**: 18 tabelas

---

### PRD-14: Super Admin

**Checklist**:
- [ ] Usuario Super Admin existe no seed
- [ ] Endpoints `/api/admin/*` funcionando
- [ ] Pode criar organizacoes
- [ ] Pode criar Admins em organizacoes
- [ ] Acesso a metricas globais
- [ ] Acesso a configuracoes globais

**Query de Validacao**:
```sql
-- Validar PRD-14: Super Admin
SELECT
  'Super Admin' as verificacao,
  CASE
    WHEN EXISTS(
      SELECT 1 FROM usuarios
      WHERE email = 'superadmin@renovedigital.com.br'
        AND role = 'super_admin'
        AND status = 'ativo'
    ) THEN '✅ Configurado corretamente'
    ELSE '❌ FALHA - Verificar seed'
  END as status
UNION ALL
SELECT
  'Configuracoes Globais',
  CASE
    WHEN (SELECT COUNT(*) FROM configuracoes_globais) >= 5
    THEN '✅ Plataformas configuradas'
    ELSE '⚠️ Verificar seed'
  END;
```

---

## Matriz de Permissoes por Role

| Recurso | Super Admin | Admin | Member |
|---------|:-----------:|:-----:|:------:|
| **Organizacoes** |
| Criar organizacao | ✅ | ❌ | ❌ |
| Ver todas organizacoes | ✅ | ❌ | ❌ |
| Editar organizacao | ✅ | ❌ | ❌ |
| **Usuarios** |
| Criar Admin | ✅ | ❌ | ❌ |
| Criar Member | ✅ | ✅ | ❌ |
| Ver usuarios do tenant | ✅ | ✅ | ❌ |
| Editar proprio perfil | ✅ | ✅ | ✅ |
| **Configuracoes** |
| Campos customizados | ✅ | ✅ | ❌ |
| Produtos | ✅ | ✅ | ❌ |
| Etapas funil | ✅ | ✅ | ❌ |
| Webhooks | ✅ | ✅ | ❌ |
| Metas empresa | ✅ | ✅ | ❌ |
| **Dados CRM** |
| Ver contatos do tenant | ✅ | ✅ | ✅* |
| Criar contatos | ✅ | ✅ | ✅ |
| Ver oportunidades | ✅ | ✅ | ✅* |
| Criar oportunidades | ✅ | ✅ | ✅ |
| **Relatorios** |
| Metricas globais | ✅ | ❌ | ❌ |
| Metricas do tenant | ✅ | ✅ | ❌ |
| Proprio dashboard | ✅ | ✅ | ✅ |

`*` Member ve apenas dados atribuidos a ele

---

## Comandos de Terminal

### Backend

```bash
# Verificar tipos TypeScript
cd backend && npm run type-check

# Rodar testes unitarios
cd backend && npm run test

# Rodar testes com coverage
cd backend && npm run test:coverage

# Verificar lint
cd backend && npm run lint

# Build de producao
cd backend && npm run build
```

### Frontend

```bash
# Verificar tipos
npm run type-check

# Rodar testes
npm run test

# Build
npm run build
```

### Supabase

```bash
# Status da conexao
npm run supabase:status

# Listar tabelas
npm run supabase:tables

# Testar conexao
npm run supabase:test
```

---

## Script SQL Completo de Validacao

Execute este script via `mcp__supabase__execute_sql` para validacao completa:

```sql
-- ============================================
-- VALIDACAO COMPLETA DO CRM RENOVE
-- Execute via mcp__supabase__execute_sql
-- ============================================

-- 1. Resumo de Tabelas e RLS
SELECT
  'RESUMO GERAL' as secao,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tabelas,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tabelas_com_rls,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) as tabelas_sem_rls;

-- 2. Tabelas SEM RLS (CRITICO)
SELECT
  '🚨 CRITICO: Tabelas sem RLS' as alerta,
  tablename as tabela
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- 3. Super Admin
SELECT
  'Super Admin' as verificacao,
  email,
  role,
  status,
  CASE
    WHEN status = 'ativo' THEN '✅'
    ELSE '❌'
  END as ok
FROM usuarios
WHERE role = 'super_admin';

-- 4. Contagem de dados seed
SELECT
  'Planos' as entidade, COUNT(*) as total FROM planos
UNION ALL
SELECT 'Modulos', COUNT(*) FROM modulos
UNION ALL
SELECT 'Papeis', COUNT(*) FROM papeis
UNION ALL
SELECT 'Config Globais', COUNT(*) FROM configuracoes_globais;
```

---

## Checklist Final Pre-Deploy

### Seguranca
- [ ] `mcp__supabase__get_advisors` retorna 0 erros CRITICOS
- [ ] Todas tabelas com tenant tem RLS habilitado
- [ ] Funcoes tem search_path fixo
- [ ] Super Admin existe e esta ativo

### Schema
- [ ] Todas tabelas dos PRDs implementados existem
- [ ] FKs para organizacoes_saas corretas
- [ ] Constraints de check validando enums

### API
- [ ] Endpoints de auth funcionando
- [ ] Endpoints retornam status codes corretos
- [ ] Isolamento de tenant funciona

### Testes
- [ ] `npm run test` passa
- [ ] `npm run type-check` passa
- [ ] `npm run build` completa sem erros

---

## Historico de Versoes

| Versao | Data | Mudancas |
|--------|------|----------|
| v1.0 | 2026-02-04 | Versao inicial com validacoes P1-P7 e PRDs 01-05, 14 |

---

**Documento mantido por**: Arquiteto de Produto
**Ultima revisao**: 2026-02-04
