
# Plano: Mover Filtros de Busca para o Toolbar

## Contexto

Atualmente, na página `OrganizacoesPage.tsx` (e potencialmente em outras páginas com listagem), os filtros de busca e status estão em um card separado abaixo do Toolbar, ocupando espaço vertical desnecessário.

**Problema identificado (imagem de referência)**:
- O campo de busca está em um card com background branco abaixo do Toolbar
- O select de "Todos os status" também está neste card

**Solução (conforme Design System seção 11.3)**:
- Mover os filtros para o Toolbar como ícones sutis com funcionalidade de Popover/Dropdown
- Seguir o padrão Progressive Disclosure para responsividade

---

## Estrutura Proposta - Toolbar

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ TOOLBAR (48px altura)                                                           │
│ "Organizações"                    🔍 Buscar | Status ▾ | [+ Nova Organização]   │
│       ↑                               ↑          ↑               ↑              │
│  Título da página            Popover busca  Dropdown    CTA (já injetado)       │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Comportamento Responsivo

| Elemento | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|----------|-----------------|---------------------|-------------------|
| Busca | Ícone 🔍 + Popover | Ícone 🔍 + Popover | Input inline OU botão + Popover |
| Status | Ícone + Dropdown | Botão "Status ▾" | Botão "Todos os status ▾" |
| CTA | Apenas ícone (+) | Ícone + texto curto | Ícone + texto completo |

---

## Alterações Técnicas

### 1. Modificar `AdminLayout.tsx` - Componente `ToolbarWithActions`

Atualizar para aceitar **duas zonas de ações** via contexto:
- `leftActions`: Filtros e busca (injetados pelas páginas)
- `rightActions`: CTA principal (já existente como `actions`)

**OU** manter a API atual e fazer as páginas injetarem todos os elementos (filtros + CTA) como um único ReactNode.

**Recomendação**: Manter a API simples - as páginas injetam tudo no `actions`, e o layout apenas renderiza.

### 2. Modificar `OrganizacoesPage.tsx`

Remover o card de filtros e integrar busca + status diretamente no Toolbar:

```tsx
// Antes (card separado)
<div className="bg-card p-4 rounded-lg border border-border shadow-sm">
  <input ... /> 
  <select ... />
</div>

// Depois (injetado no Toolbar)
useEffect(() => {
  setActions(
    <div className="flex items-center gap-2">
      {/* Busca - Popover */}
      <SearchPopover value={busca} onChange={setBusca} />
      
      {/* Status - Dropdown */}
      <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
      
      {/* CTA */}
      <button onClick={() => setModalOpen(true)} ...>
        <Plus />
        <span className="hidden sm:inline">Nova Organização</span>
      </button>
    </div>
  )
}, [setActions, busca, statusFilter])
```

### 3. Criar Componente `SearchPopover.tsx` (Reutilizável)

Componente que exibe um ícone de busca. Ao clicar, abre um Popover com o input de texto:

```tsx
interface SearchPopoverProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchPopover({ value, onChange, placeholder }: SearchPopoverProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Focus no input quando abre
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])
  
  return (
    <>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors",
          value 
            ? "border-primary bg-primary/5 text-primary" 
            : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">
          {value ? `"${value}"` : 'Buscar'}
        </span>
      </button>
      
      {/* Popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-64 bg-popover border border-border rounded-md shadow-md p-2 z-50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
              />
            </div>
            {value && (
              <button
                onClick={() => onChange('')}
                className="w-full mt-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded"
              >
                Limpar busca
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
```

### 4. Criar Componente `StatusDropdown.tsx` (Reutilizável)

Dropdown para filtro de status:

```tsx
interface StatusDropdownProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export function StatusDropdown({ value, onChange, options, placeholder }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const selectedLabel = options.find(o => o.value === value)?.label || placeholder
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-md border transition-colors",
          value && value !== 'todas'
            ? "border-primary bg-primary/5 text-primary"
            : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <span className="hidden md:inline">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </button>
      
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-md py-1 z-50">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={cn(
                  "w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors",
                  value === option.value && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/modules/admin/components/toolbar/SearchPopover.tsx` | Componente de busca com popover |
| `src/modules/admin/components/toolbar/StatusDropdown.tsx` | Componente de dropdown de status |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Remover card de filtros, injetar componentes no Toolbar |
| `src/modules/admin/contexts/ToolbarContext.tsx` | (Opcional) Adicionar suporte a `leftActions` se desejado |

---

## Exemplo Visual Final

### Desktop (>1024px)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Organizações              [🔍 Buscar] [Todos os status ▾] [+ Nova Organização]│
└──────────────────────────────────────────────────────────────────────────────┘
```

### Tablet (768-1024px)
```
┌───────────────────────────────────────────────────────────┐
│ Organizações              [🔍] [Status ▾] [+ Nova Org]    │
└───────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────┐
│ Organizações        [🔍] [▾] [+]    │
└─────────────────────────────────────┘
```

---

## Checklist de Implementação

- [ ] Criar `SearchPopover.tsx` com popover de busca
- [ ] Criar `StatusDropdown.tsx` com dropdown de status
- [ ] Modificar `OrganizacoesPage.tsx`:
  - [ ] Remover card de filtros
  - [ ] Injetar busca + status + CTA no Toolbar via `setActions`
  - [ ] Aplicar estilos responsivos (hidden/visible por breakpoint)
- [ ] Testar em mobile, tablet e desktop
- [ ] Garantir z-index adequado nos popovers (z-50 mínimo)
- [ ] Garantir background opaco nos dropdowns (não transparente)
