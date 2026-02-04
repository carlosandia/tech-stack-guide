
# Plano: Ajustar Estilização do Header e Toolbar (Visual Leve)

## Contexto

Conforme imagem de referência enviada, a estilização atual do Header e Toolbar está muito "pesada":
- Fundo sólido branco chapado
- Textos muito escuros (preto forte)
- Bordas grossas

**Objetivo**: Tornar o Header e Toolbar mais leves, modernos e sutis, seguindo o padrão visual da referência.

---

## Análise da Imagem de Referência

| Elemento | Estado Atual | Proposta (Referência) |
|----------|--------------|----------------------|
| **Header Background** | `bg-background` (branco sólido) | `bg-background/95 backdrop-blur-sm` (transparência + blur) |
| **Header Border** | `border-border` (cinza médio) | `border-gray-200/60` (mais sutil, com opacidade) |
| **Header Shadow** | `shadow-sm` | `shadow-sm` ou remover (avaliar) |
| **Toolbar Background** | `bg-muted/50` | `bg-muted/30` ou `bg-gray-50/50` (mais leve) |
| **Toolbar Border** | `border-border` | `border-gray-200/60` (mais sutil) |
| **Texto Menu Inativo** | `text-muted-foreground` | `text-gray-500` (cinza médio) |
| **Texto Menu Ativo** | `text-primary-foreground` (branco) | Manter ou ajustar |
| **Texto Principal** | `text-foreground` (preto forte) | `text-gray-700` ou `text-gray-800` |

---

## Alterações Técnicas

### 1. Atualizar CSS Variables (`src/index.css`)

Ajustar as cores semânticas para tons mais suaves:

```css
:root {
  /* Foreground mais suave (era 222.2 84% 4.9% = quase preto) */
  --foreground: 215 20% 30%; /* Aproximadamente #3D4654 - cinza escuro suave */
  
  /* Muted-foreground levemente mais escuro para melhor contraste */
  --muted-foreground: 215 16% 40%; /* Aproximadamente #5C6574 */
  
  /* Border mais sutil */
  --border: 220 13% 90%; /* Aproximadamente #E4E7EB - mais leve */
}
```

### 2. Atualizar `AdminLayout.tsx` - Header

```tsx
{/* Header - Fundo leve com transparência e blur */}
<header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
```

### 3. Atualizar `AdminLayout.tsx` - Toolbar

```tsx
{/* Toolbar - Fundo ainda mais sutil */}
<div className="sticky top-14 z-50 h-12 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
```

### 4. Atualizar NavItem - Cores de Texto

```tsx
// Estado inativo: cinza suave
'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'

// Estado ativo: mantém primary
'bg-primary text-primary-foreground'
```

---

## Resultado Visual Esperado

### Desktop
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (fundo: branco 80% opaco + blur)                                          │
│ [Logo RENOVE]  Dashboard | Organizações | Planos | Módulos | Config   [Badge][U] │
│                   ↑ cinza suave              ↑ azul (ativo)                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (fundo: cinza bem sutil 50% opaco)                                       │
│ Organizações · Gerencie os tenants...           [🔍] [Status ▾] [+ Nova Org]     │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/index.css` | Ajustar CSS variables para tons mais suaves |
| `src/modules/admin/layouts/AdminLayout.tsx` | Atualizar classes do Header, Toolbar, NavItem e Drawer |
| `docs/designsystem.md` | Documentar novo padrão visual para Header/Toolbar |

---

## Especificações Detalhadas

### Header
| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-background` | `bg-white/80 backdrop-blur-md` |
| Border | `border-border` | `border-gray-200/60` |
| Shadow | `shadow-sm` | `shadow-sm` (manter) |

### Toolbar
| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-muted/50` | `bg-gray-50/50 backdrop-blur-sm` |
| Border | `border-border` | `border-gray-200/60` |

### Textos
| Contexto | Valor Antigo | Valor Novo |
|----------|--------------|------------|
| Título da página | `text-foreground` | `text-gray-800` |
| Subtitle | `text-muted-foreground` | `text-gray-500` |
| Menu inativo | `text-muted-foreground` | `text-gray-500` |
| Menu hover | `hover:text-foreground` | `hover:text-gray-900` |
| Nome do usuário | `text-foreground` | `text-gray-700` |

### Drawer Mobile
| Propriedade | Valor Antigo | Valor Novo |
|-------------|--------------|------------|
| Background | `bg-background` | `bg-white/95 backdrop-blur-md` |
| Border | `border-border` | `border-gray-200/60` |

---

## Atualização do Design System (docs/designsystem.md)

Adicionar nova seção ou atualizar seção 11.2:

```markdown
### 11.2 Header (Top Navigation)

#### Especificações Visuais - Estilo Leve (Glass Effect)

| Propriedade | Valor |
|-------------|-------|
| Altura | 56px (`h-14`) |
| Background | `bg-white/80` com `backdrop-blur-md` |
| Border | `border-b border-gray-200/60` |
| Shadow | `shadow-sm` (opcional, pode omitir) |
| Position | `fixed top-0 left-0 right-0` |
| Z-Index | 100 |

#### Cores de Texto

| Elemento | Cor |
|----------|-----|
| Logo texto | `text-gray-900` |
| Nav inativo | `text-gray-500` |
| Nav hover | `text-gray-900` + `bg-gray-100/70` |
| Nav ativo | `bg-primary text-primary-foreground` |
| Nome usuário | `text-gray-700` |

### 11.3 Toolbar

#### Especificações Visuais

| Propriedade | Valor |
|-------------|-------|
| Altura | 48px (`h-12`) |
| Background | `bg-gray-50/50` com `backdrop-blur-sm` |
| Border | `border-b border-gray-200/60` |
| Position | `sticky top-[56px]` |
| Z-Index | 50 |

#### Cores de Texto

| Elemento | Cor |
|----------|-----|
| Título página | `text-gray-800` (`font-semibold`) |
| Subtitle/descrição | `text-gray-500` |
```

---

## Checklist de Implementação

- [ ] Atualizar `src/index.css` com novas CSS variables (opcional, podemos usar classes diretas)
- [ ] Atualizar `AdminLayout.tsx`:
  - [ ] Header: `bg-white/80 backdrop-blur-md border-gray-200/60`
  - [ ] Toolbar: `bg-gray-50/50 backdrop-blur-sm border-gray-200/60`
  - [ ] NavItem inativo: `text-gray-500 hover:text-gray-900 hover:bg-gray-100/70`
  - [ ] Textos principais: `text-gray-800`, `text-gray-700`, `text-gray-500`
  - [ ] Drawer mobile: mesmos ajustes
- [ ] Atualizar `docs/designsystem.md`:
  - [ ] Seção 11.2 (Header) com novos valores
  - [ ] Seção 11.3 (Toolbar) com novos valores
  - [ ] Adicionar nota sobre "Glass Effect" e backdrop-blur
- [ ] Testar em todas as resoluções
- [ ] Validar contraste WCAG (cinza sobre fundo transparente)
