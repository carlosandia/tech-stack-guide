
# Plano: Mover Descrição para o Toolbar (Padrão Context Info)

## Contexto

Atualmente a descrição da página ("Gerencie os tenants da plataforma") está em uma linha separada abaixo do Toolbar, ocupando espaço vertical desnecessário.

**Situação Atual:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ TOOLBAR: Organizações                    [Buscar] [Status] [+ Nova] │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│ Gerencie os tenants da plataforma                    ← OCUPA LINHA  │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│ TABELA...                                                            │
└──────────────────────────────────────────────────────────────────────┘
```

**Proposta (conforme Design System Seção 11.3):**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR: Organizações · Gerencie os tenants da plataforma  [Buscar][Status][+]│
│              ↑                        ↑                                        │
│           Título            Descrição contextual (sutil)                       │
└────────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────────┐
│ TABELA...                                                                      │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### 1. Atualizar ToolbarContext para suportar descrição

Adicionar suporte para `subtitle` (descrição) no contexto:

```tsx
interface ToolbarContextValue {
  actions: ReactNode
  setActions: (node: ReactNode) => void
  subtitle: string | null
  setSubtitle: (text: string | null) => void
}
```

### 2. Atualizar AdminLayout.tsx - ToolbarWithActions

Modificar para renderizar título + descrição na zona esquerda:

```tsx
function ToolbarWithActions({ pageTitle }: { pageTitle: string }) {
  const { actions, subtitle } = useToolbar()

  return (
    <div className="sticky top-14 z-50 h-12 bg-muted/50 border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
        {/* Left: Título + Descrição */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-semibold text-foreground whitespace-nowrap">
            {pageTitle}
          </h1>
          {subtitle && (
            <>
              <span className="text-muted-foreground hidden sm:inline">·</span>
              <span className="text-sm text-muted-foreground hidden sm:inline truncate">
                {subtitle}
              </span>
            </>
          )}
        </div>
        
        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      </div>
    </div>
  )
}
```

### 3. Atualizar OrganizacoesPage.tsx

Injetar a descrição via `setSubtitle` e remover o parágrafo separado:

```tsx
// ANTES (linha separada)
<p className="text-sm text-muted-foreground">Gerencie os tenants da plataforma</p>

// DEPOIS (injetado no Toolbar)
useEffect(() => {
  setSubtitle('Gerencie os tenants da plataforma')
  return () => setSubtitle(null)
}, [setSubtitle])
```

---

## Comportamento Responsivo

| Breakpoint | Título | Descrição | Separador |
|------------|--------|-----------|-----------|
| Mobile (<640px) | Visível | Oculta | Oculto |
| Tablet+ (>=640px) | Visível | Visível + truncate | `·` |

**Mobile**: Apenas título visível para economizar espaço horizontal
**Desktop**: Título · Descrição (com truncate se muito longa)

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/contexts/ToolbarContext.tsx` | Adicionar `subtitle` e `setSubtitle` |
| `src/modules/admin/layouts/AdminLayout.tsx` | Renderizar descrição na zona esquerda do Toolbar |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Usar `setSubtitle` e remover `<p>` separado |
| Outras páginas admin | Adicionar `setSubtitle` quando aplicável |

---

## Resultado Visual Esperado

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Organizações · Gerencie os tenants da plataforma   [🔍 Buscar][Status▾][+ Nova]│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile
```
┌───────────────────────────────────────┐
│ Organizações           [🔍] [▾] [+]   │
└───────────────────────────────────────┘
```

---

## Checklist de Implementação

- [ ] Atualizar `ToolbarContext.tsx` com `subtitle` e `setSubtitle`
- [ ] Atualizar `AdminLayout.tsx` para renderizar descrição
- [ ] Atualizar `OrganizacoesPage.tsx`:
  - [ ] Adicionar `setSubtitle` no useEffect
  - [ ] Remover `<p className="text-sm...">` separado
- [ ] Aplicar classes responsivas (`hidden sm:inline`)
- [ ] Testar em mobile e desktop
- [ ] Aplicar padrão nas demais páginas do admin (Dashboard, Planos, etc.)
