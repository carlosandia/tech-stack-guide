
# Plano de Correção - Erros 500 nas Consultas RLS

## Diagnóstico

Após investigação completa, identifiquei a causa raiz:

| Tabela | Política Problemática | Problema |
|--------|----------------------|----------|
| `usuarios` | `admin_tenant_access` | Consulta `usuarios` dentro de `usuarios` → **RECURSÃO** |
| `usuarios` | `tenant_view_own_usuarios` | Consulta `usuarios` dentro de `usuarios` → **RECURSÃO** |
| `organizacoes_saas` | `tenant_view_own_org` | Consulta `usuarios` → **Bloqueado por RLS** |
| `organizacoes_saas` | `tenant_isolation` | Consulta `auth.users` que pode falhar |

### Dados Confirmados
- Super Admin existe em `user_roles` (auth_id: `23a69eac-f689-4b28-b8ea-f2692227254a`, role: `super_admin`)
- Super Admin existe em `usuarios` (email: superadmin@renovedigital.com.br)
- Função `is_super_admin_v2()` está correta (consulta `user_roles`, não `usuarios`)

### Políticas Atuais que FUNCIONAM
- `super_admin_full_access ON organizacoes_saas USING is_super_admin_v2()` ✅
- `super_admin_usuarios_full_access ON usuarios USING is_super_admin_v2()` ✅

### Políticas Atuais que CAUSAM ERRO
```sql
-- RECURSÃO: Consulta usuarios dentro da própria tabela usuarios
admin_tenant_access ON usuarios:
  organizacao_id = (SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid() AND role = 'admin')

-- RECURSÃO: Consulta usuarios dentro da própria tabela usuarios  
tenant_view_own_usuarios ON usuarios:
  organizacao_id IN (SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid())

-- BLOQUEIO: Consulta usuarios que está protegida por RLS recursiva
tenant_view_own_org ON organizacoes_saas:
  id IN (SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid())
```

## Solução

Remover todas as políticas que causam recursão e substituir por políticas que usam funções `SECURITY DEFINER`.

### Nova Migração SQL

```sql
-- =================================================
-- FASE 1: Remover políticas problemáticas
-- =================================================

-- Tabela usuarios
DROP POLICY IF EXISTS "admin_tenant_access" ON usuarios;
DROP POLICY IF EXISTS "admin_tenant_usuarios" ON usuarios;
DROP POLICY IF EXISTS "tenant_view_own_usuarios" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select_own_tenant" ON usuarios;
DROP POLICY IF EXISTS "member_own_usuario" ON usuarios;
DROP POLICY IF EXISTS "super_admin_all_usuarios" ON usuarios;

-- Tabela organizacoes_saas
DROP POLICY IF EXISTS "tenant_view_own_org" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_isolation" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_read_own_organizacao" ON organizacoes_saas;
DROP POLICY IF EXISTS "super_admin_all_organizacoes" ON organizacoes_saas;
DROP POLICY IF EXISTS "usuarios_select_own_organization" ON organizacoes_saas;

-- =================================================
-- FASE 2: Criar funções helper SECURITY DEFINER
-- =================================================

-- Função para obter organizacao_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacao_id 
  FROM public.usuarios 
  WHERE auth_id = auth.uid()
  LIMIT 1
$$;

-- Função para verificar se usuário é admin do tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.usuarios 
    WHERE auth_id = auth.uid() 
      AND role = 'admin'
  )
$$;

-- =================================================
-- FASE 3: Recriar políticas LIMPAS para usuarios
-- =================================================

-- Super Admin (já existe, garantir que está correta)
DROP POLICY IF EXISTS "super_admin_usuarios_full_access" ON usuarios;
CREATE POLICY "super_admin_usuarios_full_access" ON usuarios
FOR ALL TO authenticated
USING (public.is_super_admin_v2());

-- Usuário pode ler próprio perfil
CREATE POLICY "user_read_own" ON usuarios
FOR SELECT TO authenticated
USING (auth_id = auth.uid());

-- Usuário pode atualizar próprio perfil
CREATE POLICY "user_update_own" ON usuarios  
FOR UPDATE TO authenticated
USING (auth_id = auth.uid())
WITH CHECK (auth_id = auth.uid());

-- =================================================
-- FASE 4: Recriar políticas LIMPAS para organizacoes_saas
-- =================================================

-- Super Admin (já existe, garantir que está correta)
DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL TO authenticated
USING (public.is_super_admin_v2());

-- Tenant pode ler própria organização (usa função helper)
CREATE POLICY "tenant_read_own" ON organizacoes_saas
FOR SELECT TO authenticated
USING (id = public.get_user_tenant_id());
```

## Resultado Esperado

Após a migração:

| Cenário | Comportamento |
|---------|---------------|
| Super Admin acessa `/admin/organizacoes` | Lista todas organizações |
| Super Admin faz login | Busca usuário em `usuarios` com sucesso |
| Admin de tenant acessa dashboard | Vê apenas própria organização |
| Member de tenant | Lê apenas próprio perfil |

## Arquivos a Modificar

| Recurso | Alteração |
|---------|-----------|
| **Migração SQL** | Limpar políticas antigas e recriar com funções SECURITY DEFINER |

## Fluxo da Solução

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        ANTES (COM ERRO)                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SELECT * FROM usuarios WHERE auth_id = X                              │
│       │                                                                 │
│       ▼                                                                 │
│  RLS: admin_tenant_access                                              │
│       │                                                                 │
│       ▼ (sub-select)                                                   │
│  SELECT organizacao_id FROM usuarios WHERE auth_id = X                 │
│       │                                                                 │
│       ▼                                                                 │
│  RLS: admin_tenant_access (novamente)                                  │
│       │                                                                 │
│       ▼                                                                 │
│  ❌ RECURSÃO INFINITA → 500 ERROR                                      │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                        DEPOIS (CORRIGIDO)                              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SELECT * FROM usuarios WHERE auth_id = X                              │
│       │                                                                 │
│       ▼                                                                 │
│  RLS: super_admin_usuarios_full_access                                 │
│       │                                                                 │
│       ▼                                                                 │
│  is_super_admin_v2() [SECURITY DEFINER]                                │
│       │                                                                 │
│       ▼                                                                 │
│  SELECT FROM user_roles WHERE user_id = X AND role = 'super_admin'     │
│       │                                                                 │
│       ▼                                                                 │
│  ✅ TRUE → Acesso permitido                                            │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

## Checklist

- [ ] Dropar políticas antigas que causam recursão
- [ ] Criar função `get_user_tenant_id()` SECURITY DEFINER  
- [ ] Criar função `is_tenant_admin()` SECURITY DEFINER
- [ ] Recriar políticas limpas para `usuarios`
- [ ] Recriar políticas limpas para `organizacoes_saas`
- [ ] Testar login do Super Admin
- [ ] Testar listagem de organizações
