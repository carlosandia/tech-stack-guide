
# Plano de Refatoração - Aderência ao Design System

## Análise do Problema

Após análise detalhada do código atual versus o `docs/designsystem.md`, identifiquei **dois problemas críticos**:

### Problema 1: Layout Incorreto (Sidebar Lateral)

O Design System especifica explicitamente na seção **11. Padrões de Navegação** (linhas 1632-1935):

> **IMPORTANTE**: O CRM Renove utiliza navegação horizontal no topo (Header + Toolbar), NÃO utiliza sidebar lateral. Esta decisão arquitetural é IMUTÁVEL e deve ser seguida em todas as implementações de frontend.

**Layout ATUAL (Incorreto):**
```
┌──────────────────────────────────────────────────────┐
│ Sidebar             │  Header                        │
│ (Lateral Esquerda)  │──────────────────────────────────
│ - Dashboard         │  Conteúdo                      │
│ - Organizações      │                                │
│ - Planos            │                                │
│ - Módulos           │                                │
│ - Configurações     │                                │
└──────────────────────────────────────────────────────┘
```

**Layout CORRETO (Design System):**
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (56px) - Navegação global entre módulos (position: fixed, top: 0)        │
│ [Logo RENOVE]  Dashboard | Organizações | Planos | Módulos | Config   🔔 [User▾] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (48px) - Ações contextuais do módulo ativo (position: sticky)           │
│ "Super Admin"                                        [Buscar] [+ Nova Ação]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              CONTENT AREA                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Problema 2: Cores e Estilos Não-Semânticos

Apesar de melhorias anteriores, ainda existem cores hardcoded que devem usar tokens semânticos:

| Arquivo | Problema | Correção |
|---------|----------|----------|
| `AdminLayout.tsx` | `bg-gray-900`, `border-gray-800`, `text-gray-300` | Remover sidebar, usar header horizontal |
| `DashboardPage.tsx` | `bg-yellow-50`, `text-yellow-700` | `bg-warning/10`, `text-warning-foreground` |
| `OrganizacaoUsuariosTab.tsx` | Possíveis cores hardcoded | Verificar e corrigir |

---

## Especificações do Design System a Seguir

### Header (Top Navigation) - Seção 11.2

| Propriedade | Valor |
|-------------|-------|
| Altura | 56px (`h-14`) |
| Background | `bg-background` (branco) |
| Border | `border-b border-border` |
| Shadow | `shadow-sm` |
| Position | `fixed top-0 left-0 right-0` |
| Z-Index | 100 |
| Padding | `px-4 lg:px-6` |

### Toolbar (Module Toolbar) - Seção 11.3

| Propriedade | Valor |
|-------------|-------|
| Altura | 48px (`h-12`) |
| Background | `bg-muted/50` |
| Border | `border-b border-border` |
| Position | `sticky top-[56px]` |
| Z-Index | 50 |
| Padding | `px-4 lg:px-6` |

### Navigation Items - Estado dos Links

| Estado | Estilo |
|--------|--------|
| Default | `text-muted-foreground hover:text-foreground hover:bg-muted` |
| Ativo | `bg-primary text-primary-foreground` |

### Cores Semânticas para Alertas

| Status | Background | Texto |
|--------|------------|-------|
| Error | `bg-destructive/10` | `text-destructive` |
| Warning | `bg-yellow-100` | `text-yellow-700` (aceito por ser cor de status) |
| Info | `bg-primary/5` | `text-primary` |

---

## Alterações a Implementar

### Arquivo 1: `src/modules/admin/layouts/AdminLayout.tsx`

**Refatoração completa** do layout para usar Header + Toolbar horizontal:

**Estrutura Nova:**
```tsx
<div className="min-h-screen bg-background">
  {/* Header Fixo - 56px */}
  <header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-background border-b border-border shadow-sm">
    <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <Logo />
        
        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem href="/admin" exact>Dashboard</NavItem>
          <NavItem href="/admin/organizacoes">Organizações</NavItem>
          <NavItem href="/admin/planos">Planos</NavItem>
          <NavItem href="/admin/modulos">Módulos</NavItem>
          <NavItem href="/admin/configuracoes">Configurações</NavItem>
        </nav>
      </div>
      
      {/* Actions + User Menu */}
      <div className="flex items-center gap-2">
        <Badge>Super Admin</Badge>
        <UserMenu />
      </div>
    </div>
  </header>

  {/* Toolbar Sticky */}
  <div className="sticky top-14 z-50 h-12 bg-muted/50 border-b border-border">
    {/* Conteúdo contextual por página */}
  </div>

  {/* Main Content */}
  <main className="pt-[104px] p-4 sm:p-6 lg:p-8"> {/* 56px header + 48px toolbar */}
    <Outlet />
  </main>
</div>
```

**Mobile:**
- Hamburger menu que abre drawer (não sidebar fixa)
- Bottom navigation opcional

### Arquivo 2: `src/modules/admin/pages/DashboardPage.tsx`

Pequenos ajustes nas cores de alerta (linhas 199-201):
- `bg-yellow-50` → OK para alertas (cor de status)
- Verificar consistência geral

### Arquivo 3: `src/modules/admin/pages/OrganizacoesPage.tsx`

Verificar se o botão "Nova Organização" segue o padrão:
- Botão primário: `bg-primary text-primary-foreground`
- Tamanho: `h-9` ou `h-10`
- Border-radius: `rounded-md`

---

## Componentes de Navegação

### NavItem Component (Novo)

```tsx
interface NavItemProps {
  href: string
  exact?: boolean
  children: React.ReactNode
}

function NavItem({ href, exact, children }: NavItemProps) {
  return (
    <NavLink
      to={href}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
```

### Mobile Drawer (Novo)

Para mobile (<768px), usar drawer que desliza da esquerda:
```tsx
{/* Mobile Navigation Drawer */}
<div className={`
  fixed inset-y-0 left-0 z-[300] w-64 bg-background border-r border-border
  transform transition-transform duration-200
  ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
  md:hidden
`}>
  {/* Navegação vertical apenas no drawer mobile */}
</div>
```

---

## Checklist de Implementação

### Layout Estrutural
- [ ] Remover sidebar lateral fixa
- [ ] Implementar header horizontal fixo (56px, `fixed top-0`)
- [ ] Implementar toolbar contextual (48px, `sticky top-[56px]`)
- [ ] Ajustar `pt-[104px]` no conteúdo principal
- [ ] Mobile: drawer que desliza da esquerda (não sidebar fixa)

### Cores e Tokens
- [ ] Header: `bg-background`, `border-b border-border`, `shadow-sm`
- [ ] Toolbar: `bg-muted/50`, `border-b border-border`
- [ ] Links ativos: `bg-primary text-primary-foreground`
- [ ] Links inativos: `text-muted-foreground hover:bg-muted`
- [ ] Remover qualquer `bg-gray-*` restante

### Componentes
- [ ] Logo no canto esquerdo do header
- [ ] Navegação horizontal (desktop)
- [ ] Badge "Super Admin" no header
- [ ] Avatar/User menu no canto direito
- [ ] Botão hamburger (mobile) que abre drawer

### Tipografia e Espaçamento
- [ ] Fonte: Inter (já configurada)
- [ ] Padding header: `px-4 lg:px-6`
- [ ] Gap entre nav items: `gap-1`
- [ ] Border-radius botões: `rounded-md`

---

## Resultado Visual Esperado

### Desktop (>1024px)
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [R] CRM Renove   Dashboard | Organizações | Planos | Módulos | Config   [SA] [U▾] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Organizações                                               [🔍] [+ Nova Org]    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              CONTEÚDO                                            │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────┐
│ [☰] [R] CRM Renove    [SA] [U]  │
├─────────────────────────────────┤
│ Organizações ▾    [🔍] [+]      │
├─────────────────────────────────┤
│                                 │
│          CONTEÚDO               │
│                                 │
└─────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/layouts/AdminLayout.tsx` | Refatoração completa para layout horizontal |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Ajustes de toolbar contextual |
| `src/modules/admin/pages/DashboardPage.tsx` | Verificar cores de alerta |
| `src/modules/admin/pages/PlanosPage.tsx` | Ajustes de toolbar contextual |
| `src/modules/admin/pages/ConfiguracoesGlobaisPage.tsx` | Ajustes de toolbar contextual |
