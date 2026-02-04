
# Plano de Correção - Botão Toolbar e Erro de Organizações

## Problemas Identificados

### Problema 1: Botão "Nova Organização" Sumiu do Toolbar

**Causa Raiz:** No arquivo `src/modules/admin/index.ts` (linha 7), está exportando:
```typescript
export { AdminLayout } from './layouts/AdminLayout'
```

Mas no arquivo `AdminLayout.tsx`, o `AdminLayout` é uma função **interna** (não exportada diretamente com o Provider). O wrapper correto com o `ToolbarProvider` é `AdminLayoutWrapper` exportado como `export default`.

**Resultado:** 
- O `App.tsx` importa `AdminLayout` (função interna)
- Esta função renderiza `ToolbarWithActions` que tenta usar `useToolbar()`
- O hook retorna o contexto padrão `{ actions: null, setActions: () => {} }` porque não há Provider
- As páginas chamam `setActions()` mas o estado nunca é atualizado

### Problema 2: Erro 403 "permission denied for table users"

**Causa Raiz:** Existem **políticas RLS conflitantes** na tabela `organizacoes_saas`:

1. **Migração antiga** `00001_create_organizacoes_saas.sql` criou:
   - `super_admin_all_organizacoes` (usa `auth.jwt() ->> 'role'`)

2. **Migração nova** `20260204225635...sql` criou:
   - `super_admin_full_access` (usa função `is_super_admin()`)

A função `is_super_admin()` consulta `auth.users`, que pode não ter permissão SELECT para o usuário `authenticated`, causando o erro.

**Evidência do JWT:**
```json
{
  "user_metadata": {
    "nome": "Super Admin",
    "role": "super_admin"
  }
}
```

O role está em `user_metadata.role`, mas a função `is_super_admin()` busca em `raw_user_meta_data->>'role'`.

---

## Correções a Implementar

### Correção 1: Exportar `AdminLayoutWrapper` Corretamente

**Arquivo:** `src/modules/admin/layouts/AdminLayout.tsx`

Renomear e exportar corretamente:
```typescript
// Antes (linha 99):
export function AdminLayout() { ... }

// Depois:
function AdminLayoutInner() { ... }

// Antes (linha 305-311):
function AdminLayoutWrapper() {
  return (
    <ToolbarProvider>
      <AdminLayout />
    </ToolbarProvider>
  )
}

export default AdminLayoutWrapper

// Depois:
export function AdminLayout() {
  return (
    <ToolbarProvider>
      <AdminLayoutInner />
    </ToolbarProvider>
  )
}

export default AdminLayout
```

**Arquivo:** `src/modules/admin/index.ts`

Manter export named (já está correto se corrigirmos o layout).

### Correção 2: Corrigir RLS com Políticas Não-Conflitantes

**Nova Migração SQL:**

```sql
-- Dropar políticas antigas para evitar conflito
DROP POLICY IF EXISTS "super_admin_all_organizacoes" ON organizacoes_saas;
DROP POLICY IF EXISTS "super_admin_full_access" ON organizacoes_saas;
DROP POLICY IF EXISTS "tenant_read_own_organizacao" ON organizacoes_saas;
DROP POLICY IF EXISTS "usuarios_select_own_organization" ON organizacoes_saas;

-- Recriar função is_super_admin usando JWT diretamente (sem consultar auth.users)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Mudado de DEFINER para evitar problemas de permissão
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin',
    false
  )
$$;

-- Super admin pode ver todas organizações
CREATE POLICY "super_admin_full_access" ON organizacoes_saas
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
);

-- Usuarios podem ver própria organização
CREATE POLICY "tenant_view_own_org" ON organizacoes_saas
FOR SELECT
USING (
  id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
);
```

---

## Checklist de Implementação

### Frontend
- [ ] Renomear `AdminLayout` para `AdminLayoutInner` 
- [ ] Fazer `AdminLayoutWrapper` se chamar `AdminLayout` e ser exportado diretamente
- [ ] Garantir que `ToolbarProvider` envolva o layout corretamente

### Database (Migração SQL)
- [ ] Dropar políticas RLS conflitantes em `organizacoes_saas`
- [ ] Recriar função `is_super_admin()` usando JWT direto (sem `auth.users`)
- [ ] Recriar políticas RLS usando `auth.jwt() -> 'user_metadata' ->> 'role'`
- [ ] Aplicar mesma lógica para tabela `usuarios`

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/layouts/AdminLayout.tsx` | Renomear e exportar `AdminLayout` com Provider |
| **Nova Migração SQL** | Corrigir RLS para usar `auth.jwt()` ao invés de `auth.users` |

---

## Resultado Esperado

### Toolbar com Botão
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│ Organizações                                         [+ Nova Organização]         │  ← Botão visível
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ Gerencie os tenants da plataforma                                                 │
│                                                                                   │
│ [Lista de organizações carregada com sucesso]                                     │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```
