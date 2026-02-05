
# Plano: Ajustar Estilo Visual Leve (Conforme Referência)

## Problema Identificado

Analisando as duas imagens enviadas:

| Elemento | Estado Atual (image-12) | Referência (image-13) |
|----------|------------------------|----------------------|
| **Menu ativo** | `bg-primary text-primary-foreground` = Azul sólido forte | Borda + fundo muito sutil (estilo "chip outline") |
| **Botões toolbar (Buscar, Status)** | Com `border-input` visível, background | Apenas texto + ícone, SEM borda - estilo "ghost" |
| **Transições** | `transition-colors` | `transition-all duration-200` mais suave |
| **Peso visual geral** | Pesado, chapado | Leve, arejado, minimal |

---

## Alterações Propostas

### 1. Menu de Navegação - Estado Ativo

**Antes (atual):**
```tsx
// Fundo azul sólido chapado
isActive ? 'bg-primary text-primary-foreground' : ...
```

**Depois (referência):**
```tsx
// Estilo "chip" com borda sutil + fundo levemente tingido
isActive 
  ? 'border border-primary/40 bg-primary/5 text-primary' 
  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
```

O menu ativo terá:
- Borda fina azul sutil (`border-primary/40`)
- Fundo quase imperceptível (`bg-primary/5`)
- Texto azul (`text-primary`)
- Visual tipo "chip" leve, não "botão chapado"

---

### 2. Botões da Toolbar (Buscar, Status)

**Antes (atual):**
```tsx
// Com borda visível
'border border-input bg-background text-muted-foreground'
```

**Depois (referência):**
```tsx
// Estilo ghost - sem borda, apenas hover sutil
'border-none bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
```

Os botões de filtro na toolbar serão:
- Sem borda (`border-none` ou `border-transparent`)
- Fundo transparente por padrão
- Hover muito sutil (`bg-gray-100/50`)
- Apenas texto + ícone visíveis

---

### 3. Transições Mais Suaves

Adicionar transições mais fluidas em todos os elementos interativos:

```tsx
// Antes
'transition-colors'

// Depois  
'transition-all duration-200 ease-in-out'
```

---

### 4. Hover States Mais Sutis

Usar transparências menores para hovers:
- `hover:bg-gray-100/50` ao invés de `hover:bg-gray-100`
- Bordas com opacidade em hovers ao invés de cores sólidas

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/layouts/AdminLayout.tsx` | Ajustar NavItem para estilo "chip outline" quando ativo |
| `src/modules/admin/components/toolbar/SearchPopover.tsx` | Remover borda, estilo ghost |
| `src/modules/admin/components/toolbar/StatusDropdown.tsx` | Remover borda, estilo ghost |
| `docs/designsystem.md` | Atualizar especificações de Nav ativo e botões toolbar |

---

## Resultado Visual Esperado

### Menu de Navegação

```
 Dashboard   [Organizações]   Planos   Módulos   Configurações
    ↑             ↑               ↑
  cinza       chip outline     cinza
            (borda azul sutil
            + fundo levíssimo)
```

### Toolbar

```
Organizações · Gerencie os tenants    Q Buscar   Todos os status ▾   [+ Nova Org]
                                         ↑              ↑                 ↑
                                      sem borda     sem borda        azul sólido (CTA)
                                      ghost style   ghost style
```

---

## Detalhes Técnicos

### NavItem - Estado Ativo (Nova Especificação)

```tsx
isActive
  ? 'border border-primary/40 bg-primary/5 text-primary font-medium'
  : 'border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
```

### SearchPopover - Botão Trigger (Nova Especificação)

```tsx
// Estado normal (sem busca ativa)
'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-md transition-all duration-200'

// Estado com busca ativa
'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-primary bg-primary/5 rounded-md transition-all duration-200'
```

### StatusDropdown - Botão Trigger (Nova Especificação)

```tsx
// Estado normal (sem filtro)
'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-md transition-all duration-200'

// Estado com filtro ativo
'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-primary bg-primary/5 rounded-md transition-all duration-200'
```

---

## Atualização do Design System

### Seção 11.2 - Header - Nav Items

| Estado | Estilo Antigo | Estilo Novo |
|--------|---------------|-------------|
| **Inativo** | `text-gray-500 hover:text-gray-900 hover:bg-gray-100/70` | `border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50` |
| **Ativo** | `bg-primary text-primary-foreground` | `border border-primary/40 bg-primary/5 text-primary font-medium` |

### Seção 11.3 - Toolbar - Action Buttons

| Tipo | Estilo Antigo | Estilo Novo |
|------|---------------|-------------|
| **Busca/Filtros** | `border border-input bg-background` | `border-none bg-transparent text-gray-500 hover:bg-gray-100/50` |
| **CTA Principal** | `bg-primary text-white` | Mantém (azul sólido é correto para CTA) |

---

## Checklist de Implementação

- [ ] Atualizar `AdminLayout.tsx`:
  - [ ] NavItem: trocar para estilo "chip outline" quando ativo
  - [ ] NavItem: transição `transition-all duration-200`
  - [ ] Drawer mobile: mesmos ajustes
- [ ] Atualizar `SearchPopover.tsx`:
  - [ ] Remover borda do botão trigger
  - [ ] Aplicar estilo ghost (bg-transparent)
  - [ ] Transição `transition-all duration-200`
- [ ] Atualizar `StatusDropdown.tsx`:
  - [ ] Remover borda do botão trigger
  - [ ] Aplicar estilo ghost
  - [ ] Transição `transition-all duration-200`
- [ ] Atualizar `docs/designsystem.md`:
  - [ ] Seção 11.2: Nav Items com novo padrão
  - [ ] Seção 11.3: Toolbar buttons estilo ghost
  - [ ] Adicionar nota sobre "Soft Outline Style" vs "Solid Background"
