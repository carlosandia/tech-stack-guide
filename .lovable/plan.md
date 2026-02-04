
# Plano de Correção - Layout com Sticky Toolbar

## Problema Identificado

Analisando o código atual do `AdminLayout.tsx`:

```tsx
// Linha 293 - ATUAL (INCORRETO):
<div className="fixed top-14 left-0 right-0 z-50 h-12 bg-muted/50 border-b border-border">

// Linha 281 - ATUAL:
<main className="pt-[104px] p-4 sm:p-6 lg:p-8">
```

**Problema:** O Toolbar está usando `fixed` quando o Design System especifica `sticky top-[56px]` (linha 1813).

Quando temos:
- Header: `fixed top-0` → Sai do fluxo do documento
- Toolbar: `fixed top-14` → Também sai do fluxo
- Main: `pt-[104px]` → Tenta compensar ambos

Isso causa problemas porque o `padding-top` do main precisa compensar exatamente 104px, mas há conflitos com outros paddings (`p-4`, `p-6`, `p-8`).

## Solução Conforme Design System

A arquitetura correta é:

| Camada | Posição | Z-Index |
|--------|---------|---------|
| Header | `fixed top-0` | 100 |
| Toolbar | `sticky top-[56px]` | 50 |
| Content | `relative` (fluxo normal) | 0 |

### Nova Estrutura de Layout

```tsx
<div className="min-h-screen bg-background pt-14"> {/* pt-14 = 56px para compensar header fixed */}
  
  {/* Header FIXED - 56px */}
  <header className="fixed top-0 left-0 right-0 z-[100] h-14 ...">
    ...
  </header>

  {/* Toolbar STICKY - 48px */}
  <div className="sticky top-14 z-50 h-12 bg-muted/50 border-b border-border">
    ...
  </div>

  {/* Main - sem pt extra, apenas padding normal */}
  <main className="p-4 sm:p-6 lg:p-8">
    <Outlet />
  </main>
</div>
```

## Alterações no Arquivo

### Arquivo: `src/modules/admin/layouts/AdminLayout.tsx`

**1. Container raiz (linha 118):**
```tsx
// DE:
<div className="min-h-screen bg-background">

// PARA:
<div className="min-h-screen bg-background pt-14">
```

**2. Toolbar (linha 293 no componente ToolbarWithActions):**
```tsx
// DE:
<div className="fixed top-14 left-0 right-0 z-50 h-12 bg-muted/50 border-b border-border">

// PARA:
<div className="sticky top-14 z-50 h-12 bg-muted/50 border-b border-border">
```

**3. Main content (linha 281):**
```tsx
// DE:
<main className="pt-[104px] p-4 sm:p-6 lg:p-8">

// PARA:
<main className="p-4 sm:p-6 lg:p-8">
```

## Resultado Esperado

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (fixed, z-100) - 56px                                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (sticky, z-50) - 48px                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              CONTENT AREA                                        │
│                           (padding normal)                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Com esta estrutura:
- O container raiz tem `pt-14` (56px) para compensar o header fixed
- O toolbar usa `sticky top-14` para "grudar" abaixo do header ao scrollar
- O main não precisa de padding-top extra, apenas o padding normal de conteúdo

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/modules/admin/layouts/AdminLayout.tsx` | Ajustar posicionamento do container, toolbar e main |

## Checklist

- [ ] Adicionar `pt-14` ao container raiz
- [ ] Mudar toolbar de `fixed` para `sticky`
- [ ] Remover `pt-[104px]` do main
- [ ] Manter apenas `p-4 sm:p-6 lg:p-8` no main
