
# Plano de Correção - Layout e Conexão com Backend

## Problemas Identificados

### Problema 1: Toolbar Sobreposta ao Header

**Causa:** A página `OrganizacoesPage.tsx` tem seu próprio título e botão "Nova Organização" dentro do conteúdo (linhas 78-91), mas o `AdminLayout` já renderiza um toolbar fixo com o título da página (linha 277-283). Isso cria duplicação visual - o toolbar do layout mostra apenas o título "Organizações" enquanto a página renderiza outro header com título + botão.

**Impacto Visual:**
```
┌────────────────────────────────────────────────────────┐
│ HEADER (nav horizontal)                                │
├────────────────────────────────────────────────────────┤
│ Toolbar: "Organizações" (sem ações)                    │  ← Vazio à direita
├────────────────────────────────────────────────────────┤
│ CONTEÚDO:                                              │
│   "Organizações" + descrição + [+ Nova Organização]    │  ← Duplicado!
│   ...                                                  │
```

**Solução:** Mover o botão "Nova Organização" para o toolbar do layout usando React Portal ou passando ações via contexto/props.

---

### Problema 2: Frontend Chamando Backend Express Local

**Causa:** O arquivo `src/lib/api.ts` configura o axios para chamar `http://localhost:3001/api` (linha 17-18), mas esse backend Express não está rodando no ambiente Lovable.

**Logs de erro:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/v1/admin/organizacoes?page=1&limit=10&status=todas' 
has been blocked by CORS policy: Permission was denied for this request to access the `loopback` address space.
```

**Arquivos afetados:**
- `src/lib/api.ts` - Cliente axios apontando para localhost
- `src/modules/admin/services/admin.api.ts` - Usa o cliente api para todas as chamadas
- Todas as páginas admin (Dashboard, Organizações, Planos, etc.)

**Solução:** Migrar as chamadas para usar **Supabase diretamente** (queries diretas às tabelas) ou criar **Edge Functions** para endpoints complexos.

---

### Problema 3: Recursão Infinita na Policy RLS

**Causa:** A política `super_admin_full_access` na tabela `usuarios` faz um subselect na própria tabela `usuarios`, criando recursão infinita:

```sql
-- Política problemática:
qual: (EXISTS ( SELECT 1 FROM usuarios u WHERE ((u.auth_id = auth.uid()) AND ((u.role)::text = 'super_admin'::text))))
```

Quando o usuário tenta consultar `usuarios`, o RLS precisa verificar se ele é super_admin consultando... a tabela `usuarios`. Isso gera loop infinito.

**Log de erro:**
```
"code": "42P17", "message": "infinite recursion detected in policy for relation \"usuarios\""
```

**Solução:** Alterar a política para usar `auth.users.raw_user_meta_data->>'role'` ao invés de consultar a tabela `usuarios`.

---

## Arquitetura da Solução

### Fase 1: Corrigir RLS da Tabela `usuarios`

Criar nova política que usa metadata do auth.users:

```sql
-- Dropar política antiga com recursão
DROP POLICY IF EXISTS "super_admin_full_access" ON usuarios;

-- Criar nova política sem recursão
CREATE POLICY "super_admin_full_access" ON usuarios
FOR ALL
USING (
  (auth.jwt() ->> 'role')::text = 'super_admin' 
  OR 
  ((SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'super_admin')
  OR
  current_setting('app.bypass_rls', true) = 'true'
);
```

### Fase 2: Migrar API Admin para Supabase Direto

**Arquivos a modificar:**
- `src/modules/admin/services/admin.api.ts` - Remover axios, usar supabase client

**Exemplo de migração:**

```typescript
// ANTES (usa axios/Express):
export async function listarOrganizacoes(params) {
  const response = await api.get('/v1/admin/organizacoes', { params })
  return response.data.data
}

// DEPOIS (usa Supabase direto):
export async function listarOrganizacoes(params) {
  let query = supabase
    .from('organizacoes_saas')
    .select('*', { count: 'exact' })
    .order('criado_em', { ascending: false })
    
  if (params?.status && params.status !== 'todas') {
    query = query.eq('status', params.status)
  }
  if (params?.busca) {
    query = query.ilike('nome', `%${params.busca}%`)
  }
  
  const { data, error, count } = await query
    .range((params.page - 1) * params.limit, params.page * params.limit - 1)
    
  return {
    organizacoes: data || [],
    total: count || 0,
    pagina: params.page,
    limite: params.limit,
    total_paginas: Math.ceil((count || 0) / params.limit)
  }
}
```

### Fase 3: Refatorar Layout para Toolbar Contextual

**Estratégia:** Usar React Portal para renderizar ações no slot do toolbar

**Arquivo: `src/modules/admin/layouts/AdminLayout.tsx`**

```tsx
// Criar contexto para ações do toolbar
export const ToolbarActionsContext = createContext<{
  setActions: (node: ReactNode) => void
}>({ setActions: () => {} })

// No layout:
const [toolbarActions, setToolbarActions] = useState<ReactNode>(null)

<div className="fixed top-14 left-0 right-0 z-50 h-12 bg-muted/50 border-b border-border">
  <div className="flex items-center justify-between h-full px-4 lg:px-6">
    <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
    <div className="flex items-center gap-2">
      {toolbarActions}
    </div>
  </div>
</div>
```

**Arquivo: `src/modules/admin/pages/OrganizacoesPage.tsx`**

```tsx
// Remover header duplicado, usar toolbar do layout
const { setActions } = useContext(ToolbarActionsContext)

useEffect(() => {
  setActions(
    <button onClick={() => setModalOpen(true)} className="...">
      <Plus className="w-4 h-4" />
      Nova Organização
    </button>
  )
  return () => setActions(null)
}, [])
```

---

## Checklist de Implementação

### Banco de Dados
- [ ] Corrigir policy `super_admin_full_access` em `usuarios` (remover recursão)
- [ ] Verificar policy `super_admin_full_access` em `organizacoes_saas` (usa auth.users.role, OK)

### Frontend - API Service
- [ ] Refatorar `src/modules/admin/services/admin.api.ts` para usar Supabase direto
- [ ] Implementar query `listarOrganizacoes` com Supabase
- [ ] Implementar query `obterMetricasResumo` (ou mock para MVP)
- [ ] Remover dependência do axios para endpoints admin

### Frontend - Layout
- [ ] Criar `ToolbarActionsContext` no AdminLayout
- [ ] Adicionar slot para ações no toolbar fixo
- [ ] Remover headers duplicados das páginas:
  - `OrganizacoesPage.tsx` (linhas 78-91)
  - `PlanosPage.tsx`
  - `ConfiguracoesGlobaisPage.tsx`
  - `DashboardPage.tsx`

### Frontend - Páginas
- [ ] `OrganizacoesPage.tsx` - Usar contexto para injetar botão no toolbar
- [ ] `PlanosPage.tsx` - Idem
- [ ] Manter descrição inline no conteúdo (abaixo do toolbar)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migration SQL** | Corrigir policy RLS `usuarios` |
| `src/modules/admin/layouts/AdminLayout.tsx` | Adicionar contexto para ações do toolbar |
| `src/modules/admin/services/admin.api.ts` | Migrar de axios para Supabase client |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Remover header duplicado, usar contexto toolbar |
| `src/modules/admin/pages/DashboardPage.tsx` | Remover header, usar Supabase para métricas |
| `src/modules/admin/pages/PlanosPage.tsx` | Remover header duplicado |
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | Remover header duplicado |

---

## Resultado Esperado

### Antes (Atual):
```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
├──────────────────────────────────────────────────┤
│ Toolbar: "Organizações"              [vazio]     │
├──────────────────────────────────────────────────┤
│ "Organizações"                                   │  ← Duplicado
│ "Gerencie os tenants..."   [+ Nova Organização]  │
│                                                  │
│ [Erro ao carregar organizacoes]                  │  ← API falhando
└──────────────────────────────────────────────────┘
```

### Depois (Corrigido):
```
┌──────────────────────────────────────────────────┐
│ HEADER                                           │
├──────────────────────────────────────────────────┤
│ Toolbar: "Organizações"     [+ Nova Organização] │  ← Ações no toolbar
├──────────────────────────────────────────────────┤
│ Gerencie os tenants da plataforma                │  ← Descrição sutil
│                                                  │
│ [Tabela de organizações carregada do Supabase]   │  ← Dados reais
└──────────────────────────────────────────────────┘
```
