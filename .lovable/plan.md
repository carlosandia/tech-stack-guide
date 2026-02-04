
# Plano: Ajustar Estilização do Header e Toolbar (Visual Leve)

## ✅ IMPLEMENTADO

Este plano foi implementado com sucesso em 2026-02-04.

---

## Contexto

Conforme imagem de referência enviada, a estilização foi ajustada para um visual mais leve e moderno.

---

## Alterações Implementadas

### 1. CSS Variables (`src/index.css`)

| Variável | Valor Antigo | Valor Novo |
|----------|--------------|------------|
| `--foreground` | `222.2 84% 4.9%` (preto forte) | `215 20% 30%` (cinza escuro suave) |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 16% 47%` |
| `--border` | `214.3 31.8% 91.4%` | `220 13% 90%` (mais sutil) |

### 2. Header (`AdminLayout.tsx`)

| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-background` | `bg-white/80 backdrop-blur-md` |
| Border | `border-border` | `border-gray-200/60` |
| Shadow | `shadow-sm` | Removido |

### 3. Toolbar (`AdminLayout.tsx`)

| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-muted/50` | `bg-gray-50/50 backdrop-blur-sm` |
| Border | `border-border` | `border-gray-200/60` |

### 4. Cores de Texto

| Contexto | Valor Antigo | Valor Novo |
|----------|--------------|------------|
| Título página | `text-foreground` | `text-gray-800` |
| Subtitle | `text-muted-foreground` | `text-gray-500` |
| Menu inativo | `text-muted-foreground` | `text-gray-500` |
| Menu hover | `hover:text-foreground` | `hover:text-gray-900` |
| Logo texto | `text-foreground` | `text-gray-900` |
| Nome usuário | `text-foreground` | `text-gray-700` |

### 5. Drawer Mobile

| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-background` | `bg-white/95 backdrop-blur-md` |
| Border | `border-border` | `border-gray-200/60` |

### 6. Design System (`docs/designsystem.md`)

- Seção 11.2 (Header) atualizada com novo padrão Glass Effect
- Seção 11.3 (Toolbar) atualizada com novo padrão Glass Effect
- Documentação de cores de texto específicas
- Exemplos de código atualizados

---

## Resultado Visual

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (fundo: branco 80% opaco + blur)                                          │
│ [Logo RENOVE]  Dashboard | Organizações | Planos | Módulos | Config   [Badge][U] │
│                   ↑ cinza suave (gray-500)    ↑ azul (ativo)                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (fundo: cinza bem sutil 50% opaco + blur)                                │
│ Organizações · Gerencie os tenants...           [🔍] [Status ▾] [+ Nova Org]     │
│      ↑ gray-800    ↑ gray-400     ↑ gray-500                                     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

- [x] Atualizar `src/index.css` com novas CSS variables
- [x] Atualizar `AdminLayout.tsx`:
  - [x] Header: `bg-white/80 backdrop-blur-md border-gray-200/60`
  - [x] Toolbar: `bg-gray-50/50 backdrop-blur-sm border-gray-200/60`
  - [x] NavItem inativo: `text-gray-500 hover:text-gray-900 hover:bg-gray-100/70`
  - [x] Textos principais: `text-gray-800`, `text-gray-700`, `text-gray-500`
  - [x] Drawer mobile: mesmos ajustes
- [x] Atualizar `docs/designsystem.md`:
  - [x] Seção 11.2 (Header) com novos valores
  - [x] Seção 11.3 (Toolbar) com novos valores
  - [x] Adicionar nota sobre "Glass Effect" e backdrop-blur
