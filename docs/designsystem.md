# Design System - CRMBeta

| Campo | Valor |
|-------|-------|
| **Versao** | v1.0 |
| **Data de criacao** | 2026-02-03 |
| **Ultima atualizacao** | 2026-02-03 |
| **Status** | Aprovado |
| **Stack** | React 18, TypeScript, Tailwind CSS, shadcn/ui |

---

## Sumario

1. [Principios de Design](#1-principios-de-design)
2. [Cores](#2-cores)
3. [Tipografia](#3-tipografia)
4. [Espacamento](#4-espacamento)
5. [Border Radius](#5-border-radius)
6. [Sombras](#6-sombras)
7. [Breakpoints e Responsividade](#7-breakpoints-e-responsividade)
    - [Progressive Disclosure](#77-progressive-disclosure-e-comportamento-adaptativo)
8. [Z-Index](#8-z-index)
9. [Icones](#9-icones)
10. [Componentes](#10-componentes)
    - [Button](#101-button)
    - [Input](#102-input)
    - [Badge](#103-badge)
    - [Card](#104-card)
    - [Modal/Dialog](#105-modaldialog)
    - [Popover](#106-popover)
    - [Tooltip](#107-tooltip)
    - [Toast/Notification](#108-toastnotification)
    - [Tabs](#109-tabs)
    - [Table](#1010-table)
11. [Padroes de Navegacao](#11-padroes-de-navegacao)
12. [Formularios](#12-formularios)
13. [Estados de Feedback](#13-estados-de-feedback)
14. [Animacoes e Transicoes](#14-animacoes-e-transicoes)
15. [Acessibilidade](#15-acessibilidade)
16. [Checklist de Implementacao](#16-checklist-de-implementacao)

---

## 1. Principios de Design

### 1.1 Valores Fundamentais

| Principio | Descricao |
|-----------|-----------|
| **Consistencia** | Mesmos padroes visuais em toda aplicacao |
| **Clareza** | Hierarquia visual clara, informacoes escaneiaveis |
| **Eficiencia** | Reduzir fricao, minimizar cliques |
| **Acessibilidade** | WCAG 2.2 AA como minimo |
| **Responsividade** | Mobile-first, funciona em qualquer dispositivo |

### 1.2 Tom Visual

- **Profissional e moderno** - nao formal demais, nem casual demais
- **Limpo e organizado** - espacamento generoso, sem poluicao visual
- **Amigavel** - cores quentes nos CTAs, arredondamentos moderados
- **Confiavel** - cores de status claras, feedback imediato

### 1.3 Linguagem Visual

- Interface em **PT-BR** com acentos
- Mensagens diretas e objetivas
- Evitar jargoes tecnicos para o usuario final
- Usar verbos de acao nos botoes ("Salvar", "Criar", "Excluir")

---

## 2. Cores

### 2.1 Arquitetura de Tokens

```
PRIMITIVE TOKENS (Valores Brutos)
       ↓
SEMANTIC TOKENS (Proposito)
       ↓
COMPONENT TOKENS (Especificos)
```

### 2.2 Cores Primitivas

#### Escala de Cinza

| Token | Valor | Uso |
|-------|-------|-----|
| `gray-25` | `#FAFAFA` | Backgrounds sutis |
| `gray-50` | `#F9FAFB` | Backgrounds alternados |
| `gray-100` | `#F3F4F6` | Borders leves, dividers |
| `gray-200` | `#E5E7EB` | Borders padrao |
| `gray-300` | `#D1D5DB` | Borders fortes |
| `gray-400` | `#9CA3AF` | Placeholders |
| `gray-500` | `#6B7280` | Texto secundario |
| `gray-600` | `#4B5563` | Texto terciario |
| `gray-700` | `#374151` | Texto forte |
| `gray-800` | `#1F2937` | Texto principal |
| `gray-900` | `#111827` | Texto maximo contraste |

#### Escala Primaria (Azul)

| Token | Valor | Uso |
|-------|-------|-----|
| `primary-50` | `#EFF6FF` | Background hover |
| `primary-100` | `#DBEAFE` | Background selecionado |
| `primary-200` | `#BFDBFE` | Borders leves |
| `primary-500` | `#3B82F6` | **Cor principal** |
| `primary-600` | `#2563EB` | Hover de botoes |
| `primary-700` | `#1D4ED8` | Active/pressed |

### 2.3 Cores Semanticas

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#3B82F6` | Acoes principais, CTAs, links |
| `--primary-foreground` | `#FFFFFF` | Texto sobre primary |
| `--secondary` | `#F1F5F9` | Acoes secundarias |
| `--secondary-foreground` | `#0F172A` | Texto sobre secondary |
| `--muted` | `#F1F5F9` | Backgrounds neutros |
| `--muted-foreground` | `#64748B` | Texto secundario |
| `--accent` | `#F1F5F9` | Hover states |
| `--accent-foreground` | `#0F172A` | Texto sobre accent |
| `--destructive` | `#EF4444` | Erros, acoes destrutivas |
| `--destructive-foreground` | `#FFFFFF` | Texto sobre destructive |
| `--border` | `#E2E8F0` | Borders padrao |
| `--input` | `#E2E8F0` | Borders de inputs |
| `--ring` | `#3B82F6` | Focus ring |
| `--background` | `#FFFFFF` | Fundo da aplicacao |
| `--foreground` | `#0F172A` | Texto principal |

### 2.4 Cores de Status

| Status | Background | Texto | Border | Uso |
|--------|------------|-------|--------|-----|
| **Success** | `#DCFCE7` | `#166534` | `#86EFAC` | Confirmacoes, sucesso |
| **Warning** | `#FEF3C7` | `#92400E` | `#FCD34D` | Alertas, atencao |
| **Error** | `#FEE2E2` | `#991B1B` | `#FCA5A5` | Erros, falhas |
| **Info** | `#DBEAFE` | `#1E40AF` | `#93C5FD` | Informacoes neutras |

### 2.5 Cores para Badges de Contexto

| Contexto | Background | Texto | Icone Sugerido |
|----------|------------|-------|----------------|
| `create` | `#DBEAFE` | `#2563EB` | Plus |
| `edit` | `#F3F4F6` | `#4B5563` | Pencil |
| `view` | `#F1F5F9` | `#475569` | Eye |
| `delete` | `#FEE2E2` | `#DC2626` | Trash |
| `success` | `#DCFCE7` | `#16A34A` | Check |
| `warning` | `#FEF3C7` | `#D97706` | AlertTriangle |
| `meeting` | `#E0E7FF` | `#4F46E5` | Calendar |
| `settings` | `#FFEDD5` | `#EA580C` | Settings |

### 2.6 Contraste WCAG

| Tipo | Ratio Minimo | Verificacao |
|------|--------------|-------------|
| Texto normal | 4.5:1 | Obrigatorio |
| Texto grande (18px+ ou 14px bold) | 3:1 | Obrigatorio |
| Elementos UI nao-textuais | 3:1 | Obrigatorio |
| Foco | 3:1 | Obrigatorio |

**Ferramenta de verificacao:** [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 2.7 Variaveis CSS

```css
:root {
  /* Cores Base */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  /* Primary */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;

  /* Secondary */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  /* Muted */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  /* Accent */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  /* Destructive */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  /* Borders e Inputs */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;

  /* Border Radius */
  --radius: 0.75rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
}
```

---

## 3. Tipografia

### 3.1 Fonte Principal

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

**Pesos disponiveis:** 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### 3.2 Escala Tipografica

Base: **16px** (1rem) | Ratio: **1.25** (Major Third)

| Token | Tamanho | Line Height | Peso | Uso |
|-------|---------|-------------|------|-----|
| `display` | 48px (3rem) | 1.1 | 700 | Titulos hero (landing) |
| `h1` | 32px (2rem) | 1.2 | 700 | Titulos de pagina |
| `h2` | 24px (1.5rem) | 1.3 | 600 | Secoes principais |
| `h3` | 20px (1.25rem) | 1.4 | 600 | Subsecoes |
| `h4` | 18px (1.125rem) | 1.4 | 600 | Titulos de cards |
| `body-lg` | 18px (1.125rem) | 1.6 | 400 | Texto de destaque |
| `body` | 16px (1rem) | 1.5 | 400 | **Texto padrao** |
| `body-sm` | 14px (0.875rem) | 1.5 | 400 | Texto secundario |
| `caption` | 12px (0.75rem) | 1.4 | 400 | Labels, hints |
| `overline` | 12px (0.75rem) | 1.4 | 500 | Categorias, tags |

### 3.3 Cores de Texto

| Token | Cor | Uso |
|-------|-----|-----|
| `text-foreground` | `#0F172A` | Texto principal |
| `text-muted-foreground` | `#64748B` | Texto secundario |
| `text-primary` | `#3B82F6` | Links, interativos |
| `text-destructive` | `#DC2626` | Mensagens de erro |
| `text-success` | `#16A34A` | Mensagens de sucesso |

### 3.4 Uso em Componentes

| Componente | Tamanho | Peso |
|------------|---------|------|
| Titulo de Modal | `text-lg` (18px) | `font-semibold` |
| Descricao de Modal | `text-sm` (14px) | `font-normal` |
| Label de Input | `text-sm` (14px) | `font-medium` |
| Placeholder | `text-sm` (14px) | `font-normal` |
| Texto de Botao | `text-sm` (14px) | `font-medium` |
| Badge | `text-xs` (12px) | `font-semibold` |
| Hint/Helper | `text-xs` (12px) | `font-normal` |

### 3.5 Regras de Tipografia

- **Nunca** usar fonte menor que 12px
- **Sempre** manter contraste minimo 4.5:1
- Line-height em multiplos de 4px para alinhar ao grid
- Maximo 75 caracteres por linha para legibilidade

---

## 4. Espacamento

### 4.1 Sistema de Grid

**Base:** 8px | **Sub-grid:** 4px

### 4.2 Escala de Espacamento

| Token | Valor | Uso |
|-------|-------|-----|
| `space-0` | 0px | Reset |
| `space-0.5` | 2px | Micro ajustes |
| `space-1` | 4px | Espacamento minimo |
| `space-2` | 8px | Tight |
| `space-3` | 12px | Compact |
| `space-4` | 16px | **Default** |
| `space-5` | 20px | Medio |
| `space-6` | 24px | Relaxed |
| `space-8` | 32px | Loose |
| `space-10` | 40px | Secao |
| `space-12` | 48px | Secao grande |
| `space-16` | 64px | Pagina |
| `space-20` | 80px | Pagina grande |
| `space-24` | 96px | Hero |

### 4.3 Aplicacao Pratica

| Contexto | Padding | Gap |
|----------|---------|-----|
| Card | `p-6` (24px) | - |
| Modal Header | `px-6 py-4` | - |
| Modal Content | `p-6` | `space-y-4` |
| Modal Footer | `px-6 py-4` | `gap-3` |
| Form Fields | - | `space-y-4` |
| Button Group | - | `gap-2` ou `gap-3` |
| Table Cell | `px-4 py-3` | - |
| Sidebar Item | `px-4 py-2` | - |

### 4.4 Principio de Proximidade

```
┌─────────────────────────────────┐
│ Elementos relacionados          │ ← gap-2 (8px)
│ ficam mais proximos             │
├─────────────────────────────────┤ ← gap-6 (24px)
│ Secoes diferentes               │
│ ficam mais distantes            │
└─────────────────────────────────┘
```

---

## 5. Border Radius

### 5.1 Escala

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-none` | 0px | Elementos angulares |
| `rounded-sm` | 4px | Badges pequenos |
| `rounded` | 6px | Botoes sm |
| `rounded-md` | 8px | **Inputs, botoes padrao** |
| `rounded-lg` | 12px | Cards, modais |
| `rounded-xl` | 16px | Cards grandes |
| `rounded-2xl` | 24px | Cards hero |
| `rounded-full` | 9999px | Pills, avatares |

### 5.2 Aplicacao por Componente

| Componente | Border Radius |
|------------|---------------|
| Button (default) | `rounded-md` (8px) |
| Button (sm) | `rounded` (6px) |
| Input | `rounded-md` (8px) |
| Card | `rounded-lg` (12px) |
| Modal | `rounded-lg` (12px) |
| Badge | `rounded-full` |
| Avatar | `rounded-full` |
| Dropdown | `rounded-md` (8px) |
| Toast | `rounded-lg` (12px) |

### 5.3 Proporcionalidade

- **Elementos pequenos** (< 32px altura): `rounded-sm` a `rounded`
- **Elementos medios** (32-48px): `rounded-md`
- **Elementos grandes** (> 48px): `rounded-lg` a `rounded-xl`
- **Elementos circulares**: `rounded-full`

---

## 6. Sombras

### 6.1 Escala de Elevacao

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Cards base |
| `shadow` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | Cards hover |
| `shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | Dropdowns |
| `shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)` | Modais |
| `shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` | Modais full |

### 6.2 Sombras Especiais

| Token | Valor | Uso |
|-------|-------|-----|
| `shadow-inner` | `inset 0 2px 4px 0 rgb(0 0 0 / 0.05)` | Inputs pressed |
| `shadow-glow` | `0 0 20px rgb(59 130 246 / 0.15)` | Destaque especial |

### 6.3 Aplicacao

| Componente | Estado Default | Estado Hover |
|------------|----------------|--------------|
| Card | `shadow-sm` | `shadow-md` |
| Dropdown | `shadow-md` | - |
| Modal | `shadow-lg` | - |
| Toast | `shadow-lg` | - |
| Button | `shadow-sm` | `shadow` |

---

## 7. Breakpoints e Responsividade

### 7.1 Breakpoints Oficiais

| Nome | Min Width | Dispositivos | Uso |
|------|-----------|--------------|-----|
| `xs` | 0px | Mobile pequeno | Layout single column |
| `sm` | 480px | Mobile grande | Layout ajustado |
| `md` | 768px | Tablet portrait | 2 colunas possiveis |
| `lg` | 1024px | Tablet landscape / Laptop | Sidebar visivel |
| `xl` | 1280px | Desktop | Layout completo |
| `2xl` | 1536px | Desktop grande | Espacamento generoso |
| `3xl` | 1920px | Monitor Full HD | Container max-width |

### 7.2 Configuracao Tailwind

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '0px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
  },
}
```

### 7.3 Container Widths

| Breakpoint | Max Width |
|------------|-----------|
| `sm` | 480px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1200px |
| `2xl` | 1400px |

**Container de conteudo principal:** max-width `1200px` centralizado

### 7.4 Estrategia Mobile-First

```css
/* Mobile (default) */
.component { /* estilos mobile */ }

/* Tablet */
@media (min-width: 768px) {
  .component { /* ajustes tablet */ }
}

/* Desktop */
@media (min-width: 1024px) {
  .component { /* ajustes desktop */ }
}
```

### 7.5 Padroes Responsivos

| Elemento | Mobile | Tablet | Desktop |
|----------|--------|--------|---------|
| Sidebar | Hidden (drawer) | Hidden/Toggle | Visivel |
| Cards Grid | 1 coluna | 2 colunas | 3-4 colunas |
| Modal Width | 100% - padding | 90% max 600px | max 672px |
| Table | Cards empilhados | Scroll horizontal | Tabela completa |
| Navigation | Bottom bar / Hamburger | Top bar | Top bar + Sidebar |

### 7.6 Testes Obrigatorios

| Resolucao | Device |
|-----------|--------|
| 360×800 | Mobile (Android) |
| 390×844 | iPhone 14 |
| 768×1024 | iPad Portrait |
| 1024×768 | iPad Landscape |
| 1280×800 | Laptop |
| 1920×1080 | Desktop Full HD |

### 7.7 Progressive Disclosure e Comportamento Adaptativo

#### Conceito

**Progressive Disclosure** e uma tecnica de UX que adia funcionalidades avancadas para componentes secundarios da UI. Mantem conteudo essencial na interface principal, enquanto conteudo avancado fica disponivel sob demanda.

> "Reduces users' cognitive load by gradually revealing information as needed." — Interaction Design Foundation

**Por que pertence ao Design System?** O Design System nao e apenas visual - define comportamentos e padroes de interacao. Documentar regras de visibilidade garante consistencia entre telas e decisoes centralizadas.

#### 7.7.1 O que MOSTRAR vs ESCONDER no Mobile

##### Mostrar (Core Features - sempre visiveis)

| Categoria | O que mostrar |
|-----------|---------------|
| **Navegacao** | Menu principal (3-5 itens max), busca |
| **Acoes** | CTA primario, criar novo item |
| **Dados** | Informacao essencial (nome, status) |
| **Feedback** | Notificacoes, alertas criticos |

##### Esconder/Diferir (Advanced Features)

| Categoria | O que esconder | Onde colocar |
|-----------|----------------|--------------|
| **Filtros avancados** | Multi-filtros, ordenacao complexa | Modal/Drawer |
| **Configuracoes** | Setup, integracoes, preferencias | Menu secundario |
| **Relatorios** | Analytics detalhados, exports | Tela secundaria |
| **Bulk actions** | Selecao multipla, edicao em lote | Modo ativavel |
| **Formatacao avancada** | HTML editor, templates | Sub-menu |

#### 7.7.2 Regras de Visibilidade por Viewport

| Elemento | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|----------|-----------------|---------------------|-------------------|
| **Sidebar** | Drawer (hamburger) | Toggle colapsavel | Sempre visivel |
| **Tabelas** | Cards empilhados | 3-4 colunas | Todas colunas |
| **Filtros** | Em modal/drawer | Dropdown | Expandidos inline |
| **Acoes em linha** | Menu (⋮) | Hover + menu | Hover com icones |
| **Breadcrumbs** | "← Voltar" | Path resumido | Completo |
| **Dashboards** | Cards com accordion | Grid 2 colunas | Grid 3-4 colunas |
| **Bulk actions** | Modo selecao | Toolbar flutuante | Checkboxes visiveis |
| **Tooltips** | Long-press | Hover | Hover |

#### 7.7.3 Touch Targets Obrigatorios

| Elemento | Tamanho Minimo | Referencia |
|----------|----------------|------------|
| Botoes | 48×48px | WCAG 2.5.8 |
| Links em lista | 44×44px | Apple HIG |
| Icones clicaveis | 44×44px | Google Material |
| Espaco entre targets | 8px minimo | Evitar taps acidentais |

#### 7.7.4 Thumb Zone (Zona de Alcance)

No mobile, CTAs principais devem estar na **zona de facil alcance** do polegar:

- **Bottom navigation** para acoes mais frequentes
- **FAB (Floating Action Button)** para criacao de novos itens
- **Header** apenas para busca e menu de perfil

#### 7.7.5 Simplificacao de Tabelas no Mobile

| Desktop | Mobile |
|---------|--------|
| Tabela com todas colunas | Cards empilhados |
| Checkboxes visiveis | Modo selecao ativavel |
| Acoes em hover | Menu contextual (⋮) |

**Campos essenciais para card mobile:**
1. Identificador principal (nome)
2. Informacao secundaria mais relevante (email/telefone)
3. Status/tags visuais
4. Menu de acoes (⋮)

#### 7.7.6 Segmentacao por Role

| Funcionalidade | Member | Admin | Super Admin |
|----------------|--------|-------|-------------|
| Criar lead | ✅ | ✅ | ✅ |
| Excluir lead | ❌ | ✅ | ✅ |
| Configurar pipeline | ❌ | ✅ | ✅ |
| Gerenciar usuarios | ❌ | ✅ | ✅ |
| Ver multi-tenant | ❌ | ❌ | ✅ |

#### 7.7.7 Checklist de Progressive Disclosure

Antes de implementar uma nova feature:

- [ ] Funcionalidade e essencial no mobile ou pode ir em menu?
- [ ] Touch targets tem 48px minimo?
- [ ] Tabela tem versao em cards para mobile?
- [ ] Acoes de hover tem alternativa touch (long-press, swipe)?
- [ ] CTAs principais estao na thumb zone?
- [ ] Loading prioriza dados essenciais primeiro?
- [ ] Visibilidade respeita role do usuario?
- [ ] Testou em viewport 360px de largura?

**Fontes:**
- [Userpilot - Progressive Disclosure Examples](https://userpilot.com/blog/progressive-disclosure-examples/)
- [Lollypop Design - Progressive Disclosure in SaaS](https://lollypop.design/blog/2025/may/progressive-disclosure/)
- [ProCreator - B2B Mobile App Design 2025](https://procreator.design/blog/b2b-mobile-app-interface-design-what-works/)

---

## 8. Z-Index

### 8.1 Escala Padronizada

| Token | Valor | Uso |
|-------|-------|-----|
| `z-base` | 0 | Elementos normais |
| `z-dropdown` | 50 | Dropdowns, selects |
| `z-sticky` | 100 | Headers sticky |
| `z-fixed` | 200 | Elementos fixos |
| `z-drawer` | 300 | Sidebars mobile |
| `z-modal-overlay` | 400 | Overlay de modais |
| `z-modal` | 401 | Conteudo de modais |
| `z-modal-nested` | 500 | Modal sobre modal |
| `z-popover` | 600 | Popovers |
| `z-tooltip` | 700 | Tooltips |
| `z-toast` | 800 | Toasts/Notificacoes |

### 8.2 Implementacao

```typescript
// src/styles/z-index.ts
export const Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  fixed: 200,
  drawer: 300,
  modalOverlay: 400,
  modal: 401,
  modalNested: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export const getZIndexClass = (key: keyof typeof Z_INDEX): string => {
  return `z-[${Z_INDEX[key]}]`;
};
```

---

## 9. Icones

### 9.1 Biblioteca

**Primaria:** `lucide-react`

```bash
npm install lucide-react
```

### 9.2 Tamanhos Padrao

| Contexto | Tamanho | Classe |
|----------|---------|--------|
| Inline com texto | 16px | `w-4 h-4` |
| Botao icon-only | 16px | `w-4 h-4` |
| Badge grande | 20px | `w-5 h-5` |
| Destaque | 24px | `w-6 h-6` |
| Hero/Empty state | 48px | `w-12 h-12` |

### 9.3 Cores de Icones

| Contexto | Cor |
|----------|-----|
| Neutro | `text-gray-500` |
| Ativo | `text-primary` |
| Erro | `text-destructive` |
| Sucesso | `text-green-600` |
| Warning | `text-yellow-600` |

### 9.4 Icones Comuns

| Acao | Icone |
|------|-------|
| Adicionar | `Plus` |
| Editar | `Pencil` |
| Excluir | `Trash2` |
| Fechar | `X` |
| Buscar | `Search` |
| Filtrar | `Filter` |
| Configuracoes | `Settings` |
| Usuario | `User` |
| Email | `Mail` |
| Telefone | `Phone` |
| Calendario | `Calendar` |
| Download | `Download` |
| Upload | `Upload` |
| Mais opcoes | `MoreVertical` ou `MoreHorizontal` |
| Sucesso | `Check` |
| Erro | `AlertCircle` |
| Info | `Info` |
| Warning | `AlertTriangle` |

---

## 10. Componentes

### 10.1 Button

#### Anatomia

```
┌─────────────────────────────┐
│ [Icon] Label [Icon]         │
└─────────────────────────────┘
```

#### Variantes

| Variant | Background | Texto | Border | Uso |
|---------|------------|-------|--------|-----|
| `default` | `bg-primary` | `text-white` | - | Acao principal |
| `secondary` | `bg-secondary` | `text-foreground` | - | Acao secundaria |
| `outline` | `bg-transparent` | `text-foreground` | `border` | Alternativa |
| `ghost` | `bg-transparent` | `text-foreground` | - | Acoes sutis |
| `destructive` | `bg-destructive` | `text-white` | - | Acoes perigosas |
| `link` | `bg-transparent` | `text-primary` | - | Links inline |

#### Tamanhos

| Size | Altura | Padding | Font |
|------|--------|---------|------|
| `sm` | 32px (h-8) | `px-3` | `text-xs` |
| `default` | 36px (h-9) | `px-4` | `text-sm` |
| `lg` | 40px (h-10) | `px-6` | `text-sm` |
| `icon` | 36px (h-9 w-9) | - | - |

#### Estados

| Estado | Estilo |
|--------|--------|
| Default | Cor base |
| Hover | `bg-primary/90` ou variacao |
| Focus | `ring-2 ring-ring ring-offset-2` |
| Active | Cor mais intensa |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | Spinner + texto (opcional) |

#### Codigo

```tsx
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

// Primario
<Button>Salvar</Button>

// Com icone
<Button>
  <Plus className="w-4 h-4 mr-2" />
  Criar
</Button>

// Loading
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Salvando...
</Button>

// Destructive
<Button variant="destructive">Excluir</Button>
```

#### Hierarquia de Botoes

- **Uma pagina** deve ter **apenas um** botao primario
- Botoes secundarios para acoes alternativas
- Botoes ghost para acoes menos importantes
- Botao destructive sempre com confirmacao

---

### 10.2 Input

#### Anatomia

```
Label *
┌─────────────────────────────┐
│ [Icon] Placeholder          │
└─────────────────────────────┘
Helper text ou mensagem de erro
```

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Altura | 40px (h-10) |
| Padding | `px-3 py-2` |
| Border | `border border-input` |
| Border Radius | `rounded-md` (8px) |
| Font | `text-sm` |

#### Estados

| Estado | Estilo |
|--------|--------|
| Default | `border-input` |
| Focus | `ring-2 ring-ring border-ring` |
| Error | `border-destructive ring-destructive` |
| Disabled | `opacity-50 bg-muted cursor-not-allowed` |

#### Codigo

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">
    Email <span className="text-destructive">*</span>
  </Label>
  <Input
    id="email"
    type="email"
    placeholder="seu@email.com"
  />
  <p className="text-xs text-muted-foreground">
    Usaremos para notificacoes importantes
  </p>
</div>

// Com erro
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    className="border-destructive"
    aria-invalid="true"
  />
  <p className="text-xs text-destructive">
    Email invalido
  </p>
</div>
```

---

### 10.3 Badge

#### Variantes

| Variant | Background | Texto | Uso |
|---------|------------|-------|-----|
| `default` | `bg-primary` | `text-white` | Destaque |
| `secondary` | `bg-secondary` | `text-foreground` | Neutro |
| `outline` | `bg-transparent` | `text-foreground` | Sutil |
| `destructive` | `bg-destructive` | `text-white` | Erro/Alerta |
| `success` | `bg-green-500` | `text-white` | Sucesso |
| `warning` | `bg-yellow-500` | `text-white` | Atencao |

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Padding | `px-2.5 py-0.5` |
| Font | `text-xs font-semibold` |
| Border Radius | `rounded-full` |

#### Codigo

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Novo</Badge>
<Badge variant="secondary">Rascunho</Badge>
<Badge variant="success">Ativo</Badge>
<Badge variant="destructive">Urgente</Badge>
```

---

### 10.4 Card

#### Anatomia

```
┌─────────────────────────────────────┐
│ Header (opcional)                   │
│ Titulo          [Actions]           │
│ Descricao                           │
├─────────────────────────────────────┤
│                                     │
│ Content                             │
│                                     │
├─────────────────────────────────────┤
│ Footer (opcional)                   │
└─────────────────────────────────────┘
```

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-card` |
| Border | `border border-border` |
| Border Radius | `rounded-lg` (12px) |
| Shadow | `shadow-sm` |
| Padding | `p-6` |

#### Codigo

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Titulo do Card</CardTitle>
    <CardDescription>Descricao opcional</CardDescription>
  </CardHeader>
  <CardContent>
    Conteudo principal
  </CardContent>
  <CardFooter className="flex justify-end gap-3">
    <Button variant="outline">Cancelar</Button>
    <Button>Salvar</Button>
  </CardFooter>
</Card>
```

---

### 10.5 Modal/Dialog

#### Anatomia Estrutural

```
┌─────────────────────────────────────────────────────┐
│ HEADER (position: sticky, top: 0)                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [Badge] Titulo                              [X] │ │
│ │ Descricao                                       │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ CONTENT (flex: 1, overflow-y: auto)                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │ Conteudo scrollable                             │ │
│ │ ...                                             │ │
│ │ ...                                             │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ FOOTER (position: sticky, bottom: 0)                │
│ ┌─────────────────────────────────────────────────┐ │
│ │              [Cancelar] [Confirmar]             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

#### Tipos de Modal

| Tipo | Uso | Comportamento |
|------|-----|---------------|
| **Dialog** | Formularios, confirmacoes | Centralizado, overlay |
| **Sheet** | Detalhes, edicao rapida | Desliza da lateral |
| **Drawer** | Mobile navigation | Desliza de baixo |
| **Fullscreen** | Formularios complexos | Ocupa tela inteira |
| **AlertDialog** | Confirmacoes criticas | Bloqueante, requer acao |

#### Tamanhos por Breakpoint

| Size | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|------|-----------------|---------------------|-------------------|
| `sm` | 100% - 32px | 400px | 448px (`max-w-md`) |
| `md` | 100% - 32px | 480px | 512px (`max-w-lg`) |
| `lg` | 100% - 32px | 600px | 672px (`max-w-2xl`) |
| `xl` | 100% - 16px | 90% | 896px (`max-w-4xl`) |
| `full` | 100% | 95% | 1280px (`max-w-7xl`) |
| `sheet` | 100% height | 480px width | 480px width |
| `drawer` | 90vh height | - | - |

#### Especificacoes Base

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-background` |
| Border Radius | `rounded-lg` (desktop), `rounded-t-lg` (mobile drawer) |
| Shadow | `shadow-lg` |
| Max Height | `90vh` (desktop), `100dvh - safe-area` (mobile) |
| Overlay | `bg-black/80 backdrop-blur-sm` |

#### Responsividade Mobile - REGRAS OBRIGATORIAS

##### Margins e Safe Areas

```css
/* Mobile (<768px) */
.modal-mobile {
  /* Width com margin lateral */
  width: calc(100% - 32px);      /* 16px de cada lado */
  margin: 16px;

  /* OU fullscreen com safe-area */
  width: 100%;
  margin: 0;
  padding-bottom: env(safe-area-inset-bottom);

  /* Max height respeitando safe areas */
  max-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 32px);
}

/* Tablet (768-1024px) */
.modal-tablet {
  width: 90%;
  max-width: 600px;
  margin: auto;
  max-height: 90vh;
}

/* Desktop (>1024px) */
.modal-desktop {
  width: auto;
  max-width: var(--modal-max-width);
  margin: auto;
  max-height: 90vh;
}
```

##### Comportamento Mobile Fullscreen

```tsx
// Para modais que precisam ser fullscreen no mobile
<DialogContent className="
  /* Mobile: fullscreen */
  w-full h-[100dvh] max-h-[100dvh]
  rounded-none m-0 p-0

  /* Tablet+: modal normal */
  sm:w-auto sm:h-auto sm:max-h-[90vh]
  sm:rounded-lg sm:m-4 sm:p-0
  sm:max-w-2xl
">
```

#### Estrutura de Scroll - Header/Footer Fixos

```tsx
// ESTRUTURA CORRETA - Header e Footer SEMPRE visiveis
<DialogContent className="flex flex-col max-h-[90vh] sm:max-h-[85vh]">
  {/* Header FIXO - nunca scrolla */}
  <DialogHeader className="flex-shrink-0 px-6 py-4 border-b border-border">
    <DialogTitle>Titulo</DialogTitle>
    <DialogDescription>Descricao</DialogDescription>
  </DialogHeader>

  {/* Content SCROLLABLE - unica area que scrolla */}
  <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
    {/* Conteudo do formulario */}
    <div className="space-y-4">
      {/* campos... */}
    </div>
  </div>

  {/* Footer FIXO - nunca scrolla */}
  <DialogFooter className="flex-shrink-0 px-6 py-4 border-t border-border bg-background">
    <Button variant="outline">Cancelar</Button>
    <Button>Salvar</Button>
  </DialogFooter>
</DialogContent>
```

#### Padding e Espacamento Interno

| Area | Mobile | Desktop |
|------|--------|---------|
| Header padding | `px-4 py-3` | `px-6 py-4` |
| Content padding | `px-4 py-4` | `px-6 py-4` |
| Footer padding | `px-4 py-3` | `px-6 py-4` |
| Gap entre campos | `space-y-4` | `space-y-4` |
| Gap entre secoes | `space-y-6` | `space-y-8` |
| Footer button gap | `gap-2` | `gap-3` |

#### Variantes de Modal

##### 1. Modal Padrao (Formularios)

```tsx
<DialogContent className="
  flex flex-col
  w-[calc(100%-32px)] sm:w-auto
  max-w-2xl
  max-h-[calc(100dvh-32px)] sm:max-h-[85vh]
  m-4 sm:m-auto
">
  <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 border-b">
    {/* header content */}
  </DialogHeader>

  <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 min-h-0">
    {/* scrollable content */}
  </div>

  <DialogFooter className="flex-shrink-0 px-4 sm:px-6 py-4 border-t">
    {/* buttons */}
  </DialogFooter>
</DialogContent>
```

##### 2. Sheet (Lateral)

```tsx
<Sheet>
  <SheetContent
    side="right"
    className="
      w-full sm:w-[480px] sm:max-w-[480px]
      flex flex-col
    "
  >
    <SheetHeader className="flex-shrink-0 px-6 py-4 border-b">
      <SheetTitle>Detalhes</SheetTitle>
    </SheetHeader>

    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* content */}
    </div>

    <SheetFooter className="flex-shrink-0 px-6 py-4 border-t">
      {/* actions */}
    </SheetFooter>
  </SheetContent>
</Sheet>
```

##### 3. Drawer (Mobile Bottom Sheet)

```tsx
// Usar apenas em mobile para acoes rapidas
<Drawer>
  <DrawerContent className="
    max-h-[90vh]
    rounded-t-[16px]
    pb-[env(safe-area-inset-bottom)]
  ">
    {/* Handle indicator */}
    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted my-4" />

    <DrawerHeader className="px-4">
      <DrawerTitle>Acoes</DrawerTitle>
    </DrawerHeader>

    <div className="px-4 pb-4 overflow-y-auto">
      {/* content */}
    </div>
  </DrawerContent>
</Drawer>
```

##### 4. Modal Fullscreen (Mobile)

```tsx
<DialogContent className="
  /* Mobile: tela cheia */
  fixed inset-0
  w-full h-[100dvh]
  max-w-none max-h-none
  rounded-none m-0
  flex flex-col

  /* Desktop: modal normal */
  sm:relative sm:inset-auto
  sm:w-auto sm:h-auto
  sm:max-w-2xl sm:max-h-[85vh]
  sm:rounded-lg sm:m-auto
">
  {/* Estrutura igual ao padrao */}
</DialogContent>
```

#### Header com Badge

```tsx
// Variantes de badge por tipo de modal
const headerVariants = {
  create: { icon: Plus, bg: 'bg-blue-100', color: 'text-blue-600' },
  edit: { icon: Pencil, bg: 'bg-gray-100', color: 'text-gray-600' },
  view: { icon: Eye, bg: 'bg-slate-100', color: 'text-slate-600' },
  delete: { icon: Trash2, bg: 'bg-red-100', color: 'text-red-600' },
  success: { icon: Check, bg: 'bg-green-100', color: 'text-green-600' },
  warning: { icon: AlertTriangle, bg: 'bg-yellow-100', color: 'text-yellow-600' },
};
```

#### Acessibilidade ARIA

```tsx
<Dialog>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">Titulo</DialogTitle>
      <DialogDescription id="dialog-description">
        Descricao
      </DialogDescription>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

#### Gerenciamento de Foco

| Acao | Comportamento |
|------|---------------|
| Ao abrir | Foco no primeiro elemento focavel (ou no titulo) |
| Tab | Cicla dentro do modal (focus trap) |
| Shift+Tab | Cicla reverso dentro do modal |
| Escape | Fecha o modal |
| Ao fechar | Foco retorna ao elemento que abriu |

#### Fechamento do Modal

| Metodo | Desktop | Mobile |
|--------|---------|--------|
| Botao X | Sim (canto superior direito) | Sim |
| Botao Cancelar | Sim | Sim |
| Tecla Escape | Sim | N/A |
| Click no Overlay | Opcional (desabilitar em forms com dados) | Nao recomendado |
| Swipe Down | N/A | Sim (para drawers) |

#### Prevencao de Fechamento Acidental

```tsx
// Para formularios com dados nao salvos
<Dialog
  onOpenChange={(open) => {
    if (!open && hasUnsavedChanges) {
      // Mostrar confirmacao antes de fechar
      setShowConfirmClose(true);
      return;
    }
    setIsOpen(open);
  }}
>
```

#### CSS Completo para Modal Responsivo

```css
/* Overlay */
[data-radix-dialog-overlay] {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
  z-index: 400;
}

/* Content Base */
[data-radix-dialog-content] {
  position: fixed;
  z-index: 401;
  display: flex;
  flex-direction: column;
  background: hsl(var(--background));
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Mobile: quase fullscreen */
  @media (max-width: 767px) {
    left: 16px;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    max-height: calc(100dvh - 32px);
    border-radius: 12px;
  }

  /* Tablet+ : centralizado */
  @media (min-width: 768px) {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-height: 85vh;
    border-radius: 12px;
  }
}

/* Header fixo */
.dialog-header {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  z-index: 1;
}

/* Content scrollable */
.dialog-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* importante para flex scroll */
  overscroll-behavior: contain; /* previne scroll do body */
}

/* Footer fixo */
.dialog-footer {
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  background: hsl(var(--background));
  border-top: 1px solid hsl(var(--border));
  z-index: 1;
}

/* Safe area para iOS */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .dialog-footer {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
```

#### Exemplo Completo com Todas as Regras

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Abrir Modal</Button>
  </DialogTrigger>

  <DialogContent className="
    flex flex-col
    w-[calc(100%-32px)] sm:w-auto
    max-w-2xl
    max-h-[calc(100dvh-32px)] sm:max-h-[85vh]
    m-4 sm:m-auto
    p-0
  ">
    {/* HEADER - Sempre visivel */}
    <DialogHeader className="
      flex-shrink-0
      px-4 sm:px-6 py-4
      border-b border-border
      sticky top-0 bg-background z-10
    ">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
          <Plus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <DialogTitle>Criar Contato</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo contato
          </DialogDescription>
        </div>
      </div>
    </DialogHeader>

    {/* CONTENT - Scrollable */}
    <div className="
      flex-1
      overflow-y-auto
      overscroll-contain
      px-4 sm:px-6 py-4
      min-h-0
    ">
      <div className="space-y-4">
        {/* Campos do formulario */}
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input placeholder="Nome completo" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" placeholder="email@exemplo.com" />
        </div>
        {/* ... mais campos ... */}
      </div>
    </div>

    {/* FOOTER - Sempre visivel */}
    <DialogFooter className="
      flex-shrink-0
      px-4 sm:px-6 py-4
      border-t border-border
      sticky bottom-0 bg-background z-10
      gap-2 sm:gap-3
      pb-[max(16px,env(safe-area-inset-bottom))]
    ">
      <Button variant="outline" className="flex-1 sm:flex-none">
        Cancelar
      </Button>
      <Button className="flex-1 sm:flex-none">
        Salvar
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Checklist de Modal

- [ ] Header e Footer com `flex-shrink-0` e `sticky`
- [ ] Content com `flex-1`, `overflow-y-auto` e `min-h-0`
- [ ] Mobile: width `calc(100% - 32px)` ou fullscreen
- [ ] Mobile: `max-height: calc(100dvh - 32px)`
- [ ] Mobile: `env(safe-area-inset-bottom)` no footer
- [ ] Mobile: botoes full-width (`flex-1`)
- [ ] Desktop: max-width definido
- [ ] Desktop: max-height `85-90vh`
- [ ] `overscroll-behavior: contain` no content
- [ ] Focus trap ativo
- [ ] Escape fecha o modal
- [ ] Foco retorna ao trigger ao fechar

---

### 10.6 Popover

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-popover` |
| Border | `border` |
| Border Radius | `rounded-md` |
| Shadow | `shadow-md` |
| Z-Index | 600 |
| Side Offset | 4px |

#### Posicionamento

| Posicao | Uso |
|---------|-----|
| `bottom` | Padrao para dropdowns |
| `top` | Quando nao ha espaco abaixo |
| `left` / `right` | Menus laterais |

#### Codigo

```tsx
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Opcoes</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    Conteudo do popover
  </PopoverContent>
</Popover>
```

---

### 10.7 Tooltip

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-primary` |
| Texto | `text-primary-foreground` |
| Font | `text-xs` |
| Padding | `px-3 py-1.5` |
| Border Radius | `rounded-md` |
| Z-Index | 700 |
| Delay | 200ms |

#### Codigo

```tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Info className="w-4 h-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Informacao adicional</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### 10.8 Toast/Notification

#### Variantes

| Variant | Icone | Border Color |
|---------|-------|--------------|
| `default` | - | `border-border` |
| `success` | `CheckCircle` | `border-green-500` |
| `error` | `XCircle` | `border-red-500` |
| `warning` | `AlertTriangle` | `border-yellow-500` |
| `info` | `Info` | `border-blue-500` |

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Posicao | Bottom-right (padrao) |
| Width | 356px |
| Z-Index | 800 |
| Duracao | 5000ms (padrao) |

#### Codigo

```tsx
import { toast } from "sonner";

// Sucesso
toast.success("Contato criado com sucesso!");

// Erro
toast.error("Erro ao criar contato");

// Com acao
toast("Contato excluido", {
  action: {
    label: "Desfazer",
    onClick: () => handleUndo(),
  },
});
```

---

### 10.9 Tabs

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Gap entre tabs | `gap-1` |
| Padding tab | `px-4 py-2` |
| Font | `text-sm font-medium` |
| Border ativo | `border-b-2 border-primary` |

#### Codigo

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="geral">
  <TabsList>
    <TabsTrigger value="geral">Geral</TabsTrigger>
    <TabsTrigger value="contatos">Contatos</TabsTrigger>
    <TabsTrigger value="atividades">Atividades</TabsTrigger>
  </TabsList>
  <TabsContent value="geral">Conteudo geral</TabsContent>
  <TabsContent value="contatos">Conteudo contatos</TabsContent>
  <TabsContent value="atividades">Conteudo atividades</TabsContent>
</Tabs>
```

---

### 10.10 Table

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Header BG | `bg-muted` |
| Header Font | `text-xs font-medium uppercase` |
| Cell Padding | `px-4 py-3` |
| Border | `border-b` |
| Row Hover | `hover:bg-muted/50` |

#### Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| Mobile | Cards empilhados |
| Tablet | Scroll horizontal |
| Desktop | Tabela completa |

#### Codigo

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Nome</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Acoes</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Joao Silva</TableCell>
      <TableCell>joao@email.com</TableCell>
      <TableCell><Badge variant="success">Ativo</Badge></TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

## 11. Padroes de Navegacao

> **IMPORTANTE**: O CRM Renove utiliza navegacao horizontal no topo (Header + Toolbar), NAO utiliza sidebar lateral. Esta decisao arquitetural e IMUTAVEL e deve ser seguida em todas as implementacoes de frontend.

### 11.1 Arquitetura de Navegacao

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER - Navegacao global entre modulos (position: fixed, top: 0)               │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR - Acoes e filtros contextuais do modulo ativo (position: sticky)        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ CONTENT - Area de conteudo principal (overflow-y: auto)                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

| Camada | Funcao | Posicao | Z-Index |
|--------|--------|---------|---------|
| **Header** | Navegacao entre modulos, logo, acoes globais | `fixed top-0` | 100 |
| **Toolbar** | Acoes contextuais do modulo ativo | `sticky top-[56px]` | 50 |
| **Content** | Conteudo principal da pagina | `relative` | 0 |

#### Estrutura Visual - Desktop (>1024px)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (56px altura)                                                             │
│ [Logo RENOVE]  Contatos | Conversas | Negocios | Atividades | Dashboard  🔔 ⚙️ [User▾] │
├─────────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (48px altura) - Contextual por modulo                                    │
│ Pipeline: tata44          🔍 Buscar | Metricas | Filtros | Periodo▾ | [+ Nova Oportunidade] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                              CONTENT AREA                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Estrutura Visual - Tablet (768px - 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│ [Logo]  Contatos | Conversas | Negocios | [⋯]    🔔 ⚙️ [U]     │
├─────────────────────────────────────────────────────────────────┤
│ TOOLBAR                                                         │
│ Pipeline: tata44    🔍 | Metricas | Filtros | [⋯] | [+ Nova]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        CONTENT AREA                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Estrutura Visual - Mobile (<768px)

```
┌─────────────────────────────────────┐
│ HEADER (56px)                       │
│ [☰] [Logo RENOVE]        🔔 [U]    │
├─────────────────────────────────────┤
│ TOOLBAR (48px)                      │
│ Pipeline: tata44 ▾    🔍  [⋯]  [+] │
├─────────────────────────────────────┤
│                                     │
│          CONTENT AREA               │
│                                     │
├─────────────────────────────────────┤
│ BOTTOM NAV (56px) - Opcional        │
│ 👤 Contatos | 💬 | 💼 | 📋 | 📊    │
└─────────────────────────────────────┘
```

---

### 11.2 Header (Top Navigation)

#### Especificacoes Visuais - Estilo Leve (Glass Effect)

| Propriedade | Valor |
|-------------|-------|
| Altura | 56px (`h-14`) |
| Background | `bg-white/80` com `backdrop-blur-md` |
| Border | `border-b border-gray-200/60` |
| Shadow | Nenhum (omitir para visual mais leve) |
| Position | `fixed top-0 left-0 right-0` |
| Z-Index | 100 |
| Padding | `px-4 lg:px-6` |

> **Glass Effect**: O Header utiliza transparência (80%) com backdrop-blur para criar um efeito "glass" moderno e leve. O conteúdo abaixo é levemente visível através do header durante scroll.

#### Cores de Texto

| Elemento | Cor |
|----------|-----|
| Logo texto | `text-gray-900` |
| Nav inativo | `text-gray-500` |
| Nav hover | `text-gray-900` + `bg-gray-100/70` |
| Nav ativo | `bg-primary text-primary-foreground` |
| Nome usuário | `text-gray-700` |
| Icones/Chevrons | `text-gray-500` |

#### Anatomia Desktop

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Logo]  [Nav Item] [Nav Item] [Nav Item●] [Nav Item] [Nav Item]    [🔔] [⚙️] [Avatar▾] │
│   ↑         ↑                      ↑                                    ↑        ↑     │
│  Logo   Navigation            Item Ativo                           Actions   User Menu │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Componentes do Header

##### Logo

| Propriedade | Valor |
|-------------|-------|
| Width | 120px max |
| Height | 32px |
| Margin Right | `mr-8` |

##### Navigation Items

| Propriedade | Valor |
|-------------|-------|
| Gap entre items | `gap-1` |
| Padding item | `px-3 py-2` |
| Font | `text-sm font-medium` |
| Border Radius | `rounded-md` |
| Transicao | `transition-all duration-200` |

| Estado | Estilo |
|--------|--------|
| Default | `border border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50` |
| Ativo | `border border-primary/40 bg-primary/5 text-primary` (Soft Outline Style) |
| Com dropdown | Icone `ChevronDown` (w-4 h-4) apos o texto |

> **Soft Outline Style**: O menu ativo utiliza borda sutil com opacidade (`border-primary/40`) e fundo quase imperceptível (`bg-primary/5`) ao invés de fundo sólido. Isso cria um visual mais leve e moderno, tipo "chip outline".

##### Actions Area

| Elemento | Tamanho | Estilo |
|----------|---------|--------|
| Notification Bell | 40x40px | `ghost` button, badge vermelho para contagem |
| Settings | 40x40px | `ghost` button |
| User Menu | 40x40px | Avatar circular + chevron |

#### Codigo de Referencia - Header

```tsx
<header className="fixed top-0 left-0 right-0 z-[100] h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60">
  <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
    {/* Logo */}
    <div className="flex items-center gap-8">
      <Logo className="h-8 w-auto" />

      {/* Navigation - Desktop */}
      <nav className="hidden md:flex items-center gap-1">
        <NavItem href="/contatos" active={isActive('/contatos')}>
          <Users className="w-4 h-4 mr-2" />
          Contatos
        </NavItem>
        <NavItem href="/conversas">
          <MessageSquare className="w-4 h-4 mr-2" />
          Conversas
        </NavItem>
        <NavItem href="/negocios" active>
          <Briefcase className="w-4 h-4 mr-2" />
          Negocios
        </NavItem>
        {/* ... */}
      </nav>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2">
      <NotificationBell />
      <SettingsButton />
      <UserMenu />
    </div>
  </div>
</header>
```

---

### 11.3 Toolbar (Module Toolbar)

#### Especificacoes Visuais - Estilo Leve (Glass Effect)

| Propriedade | Valor |
|-------------|-------|
| Altura | 48px (`h-12`) |
| Background | `bg-gray-50/50` com `backdrop-blur-sm` |
| Border | `border-b border-gray-200/60` |
| Position | `sticky top-[56px]` |
| Z-Index | 50 |
| Padding | `px-4 lg:px-6` |

> **Glass Effect**: O Toolbar também utiliza transparência leve (50%) com backdrop-blur sutil para manter a consistência visual com o Header.

#### Cores de Texto

| Elemento | Cor |
|----------|-----|
| Título da página | `text-gray-800` (`font-semibold`) |
| Subtitle/descrição | `text-gray-500` |
| Separador (·) | `text-gray-400` |
| Sub-nav inativo | `text-gray-500` |
| Sub-nav ativo | `text-gray-900` + `bg-gray-100/70` |

#### Anatomia

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [Título · Descrição contextual]   [Sub-Nav]   |   [Actions]              [CTA]  │
│       ↑                               ↑                ↑                   ↑     │
│ Context Info                    Navegacao interna  Filtros/acoes    Acao principal│
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### Zonas da Toolbar

| Zona | Conteudo | Alinhamento |
|------|----------|-------------|
| **Left** | Título da página · Descrição contextual + Sub-navegação | `justify-start` |
| **Right** | Busca, filtros, acoes secundarias, CTA principal | `justify-end` |

#### Elementos da Toolbar

##### Context Info (Título + Descrição)

```tsx
<div className="flex items-center gap-2 min-w-0">
  <h1 className="text-base font-semibold text-gray-800 whitespace-nowrap">
    Organizações
  </h1>
  <span className="text-gray-400 hidden sm:inline">·</span>
  <span className="text-sm text-gray-500 hidden sm:inline truncate max-w-[300px]">
    Gerencie os tenants da plataforma
  </span>
</div>
```

##### Sub-Navigation (Tabs internas do modulo)

```tsx
<div className="flex items-center gap-1 ml-6">
  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900 hover:bg-gray-100/70">
    <Users className="w-4 h-4 mr-1.5" />
    Pessoas
  </Button>
  <Button variant="ghost" size="sm" className="bg-gray-100/70 text-gray-900">
    <Building2 className="w-4 h-4 mr-1.5" />
    Empresas
  </Button>
</div>
```

##### Action Buttons (Ghost Style)

Os botões de ação na toolbar (Buscar, Filtros, Status) utilizam estilo **ghost** - sem borda visível, apenas texto e ícone. O hover é muito sutil com transparência.

| Tipo | Estilo | Tamanho |
|------|--------|---------|
| Busca | `text-gray-500 hover:text-gray-700 hover:bg-gray-100/50` (ghost) | `sm` |
| Filtros | `text-gray-500 hover:text-gray-700 hover:bg-gray-100/50` (ghost) | `sm` |
| Dropdown (Status) | `text-gray-500 hover:text-gray-700 hover:bg-gray-100/50` (ghost) | `sm` |
| Com filtro ativo | `bg-primary/5 text-primary` (sem borda) | `sm` |
| CTA Principal | `bg-primary text-primary-foreground` (sólido - destaque) | `sm` |

> **Nota**: A diferença visual entre botões ghost (filtros) e o CTA sólido (ação principal) cria hierarquia clara sem poluição visual.

##### CTA Principal

```tsx
<Button size="sm" className="ml-2">
  <Plus className="w-4 h-4 mr-1.5" />
  Nova Oportunidade
</Button>
```

#### Codigo de Referencia - Toolbar

```tsx
<div className="sticky top-14 z-50 h-12 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200/60">
  <div className="flex items-center justify-between h-full px-4 lg:px-6 max-w-[1920px] mx-auto">
    {/* Left: Context Info + Sub-nav */}
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-base font-semibold text-gray-800 whitespace-nowrap">
          Contatos
        </h1>
        <span className="text-gray-400 hidden sm:inline">·</span>
        <span className="text-sm text-gray-500 hidden sm:inline truncate">
          Gerencie sua base de contatos
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-1">
        <Button variant="ghost" size="sm" className="text-gray-500">Pessoas</Button>
        <Button variant="ghost" size="sm" className="bg-gray-100/70 text-gray-900">Empresas</Button>
      </div>
    </div>

    {/* Right: Actions */}
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="hidden lg:flex">
        <Search className="w-4 h-4 mr-1.5" />
        Buscar
      </Button>
      <Button variant="outline" size="icon" className="lg:hidden">
        <Search className="w-4 h-4" />
      </Button>

      <Button variant="outline" size="sm" className="hidden md:flex">
        <Filter className="w-4 h-4 mr-1.5" />
        Filtros
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Calendar className="w-4 h-4 mr-1.5" />
            Periodo
            <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        {/* ... */}
      </DropdownMenu>

      {/* Mobile: More actions */}
      <Button variant="outline" size="icon" className="md:hidden">
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {/* CTA */}
      <Button size="sm">
        <Plus className="w-4 h-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Nova Oportunidade</span>
      </Button>
    </div>
  </div>
</div>
```

#### Drawer Mobile (Glass Effect)

O drawer mobile também deve seguir o padrão Glass Effect:

| Propriedade | Valor |
|-------------|-------|
| Background | `bg-white/95` com `backdrop-blur-md` |
| Border | `border-r border-gray-200/60` |
| Header border | `border-b border-gray-200/60` |
| Footer border | `border-t border-gray-200/60` |
| Nav inativo | `text-gray-500 hover:text-gray-900 hover:bg-gray-100/70` |
| Nav ativo | `bg-primary text-primary-foreground` |

---

### 11.4 Toolbars por Modulo

Cada modulo possui sua propria Toolbar com acoes contextuais:

#### Modulo Contatos (`/contatos`)

| Zona Esquerda | Zona Direita |
|---------------|--------------|
| "Contatos" | Busca |
| Tabs: Pessoas \| Empresas | Duplicados (badge) |
| | Colunas |
| | Segmentacoes |
| | Importar |
| | Exportar |
| | **[+ Novo Contato]** |

#### Modulo Negocios (`/negocios`)

| Zona Esquerda | Zona Direita |
|---------------|--------------|
| "Pipeline: {nome}" | Buscar |
| Select de Pipeline | Metricas |
| | Filtros |
| | Periodo |
| | **[+ Nova Oportunidade]** |

#### Modulo Conversas (`/conversas`)

| Zona Esquerda | Zona Direita |
|---------------|--------------|
| "Conversas" | Buscar |
| Filtro: Todas \| Abertas \| Pendentes | Filtros avancados |
| | **[+ Nova Conversa]** |

#### Modulo Atividades (`/atividades`)

| Zona Esquerda | Zona Direita |
|---------------|--------------|
| "Atividades" | Buscar |
| Tabs: Tarefas \| Reunioes \| Emails | Filtros |
| | Periodo |
| | **[+ Nova Tarefa]** |

#### Modulo Dashboard (`/dashboard`)

| Zona Esquerda | Zona Direita |
|---------------|--------------|
| "Dashboard" | Periodo |
| Tabs: Visao Geral \| Vendas \| Equipe | Exportar |
| | Atualizar |

---

### 11.5 Responsividade e Progressive Disclosure

#### Breakpoints de Visibilidade

| Elemento | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) |
|----------|-----------------|---------------------|-------------------|
| **Header Nav** | Menu hamburger (drawer) | 4-5 items visiveis + overflow | Todos visiveis |
| **Header Actions** | Apenas sino + avatar | Sino + settings + avatar | Todos visiveis |
| **Toolbar Sub-nav** | Dropdown ou hidden | Tabs visiveis | Tabs visiveis |
| **Toolbar Actions** | Busca (icon) + CTA + overflow (⋯) | Busca + 2-3 acoes + CTA | Todas visiveis |
| **CTA Label** | Apenas icone (+) | Icone + texto curto | Icone + texto completo |

#### Progressive Disclosure - Header

```tsx
{/* Desktop: Navegacao completa */}
<nav className="hidden lg:flex items-center gap-1">
  {modules.map(module => <NavItem key={module.id} {...module} />)}
</nav>

{/* Tablet: Items principais + overflow */}
<nav className="hidden md:flex lg:hidden items-center gap-1">
  {modules.slice(0, 4).map(module => <NavItem key={module.id} {...module} />)}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {modules.slice(4).map(module => (
        <DropdownMenuItem key={module.id}>{module.label}</DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
</nav>

{/* Mobile: Hamburger menu */}
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden">
      <Menu className="w-5 h-5" />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" className="w-[280px]">
    <nav className="flex flex-col gap-2 mt-8">
      {modules.map(module => (
        <NavItem key={module.id} {...module} mobile />
      ))}
    </nav>
  </SheetContent>
</Sheet>
```

#### Progressive Disclosure - Toolbar

```tsx
<div className="flex items-center gap-2">
  {/* Sempre visivel: Busca (icon no mobile) */}
  <Button variant="outline" size="sm" className="hidden sm:flex">
    <Search className="w-4 h-4 mr-1.5" />
    Buscar
  </Button>
  <Button variant="outline" size="icon" className="sm:hidden">
    <Search className="w-4 h-4" />
  </Button>

  {/* Tablet+: Acoes principais */}
  <Button variant="outline" size="sm" className="hidden md:flex">
    <Filter className="w-4 h-4 mr-1.5" />
    Filtros
  </Button>

  {/* Desktop: Todas acoes */}
  <Button variant="outline" size="sm" className="hidden lg:flex">
    <BarChart3 className="w-4 h-4 mr-1.5" />
    Metricas
  </Button>

  {/* Mobile/Tablet: Overflow menu */}
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" className="lg:hidden">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem className="md:hidden">
        <Filter className="w-4 h-4 mr-2" />
        Filtros
      </DropdownMenuItem>
      <DropdownMenuItem>
        <BarChart3 className="w-4 h-4 mr-2" />
        Metricas
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Calendar className="w-4 h-4 mr-2" />
        Periodo
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  {/* CTA: Sempre visivel, label responsivo */}
  <Button size="sm">
    <Plus className="w-4 h-4 sm:mr-1.5" />
    <span className="hidden sm:inline">Nova Oportunidade</span>
  </Button>
</div>
```

---

### 11.6 Mobile Navigation (Bottom Nav) - Opcional

Para melhor usabilidade em mobile, pode-se adicionar uma Bottom Navigation:

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Altura | 56px + safe-area-inset-bottom |
| Background | `bg-background` |
| Border | `border-t border-border` |
| Position | `fixed bottom-0 left-0 right-0` |
| Z-Index | 100 |
| Visibilidade | Apenas mobile (<768px) |

#### Anatomia

```
┌─────────────────────────────────────┐
│  👤      💬      💼      📋      📊  │
│ Contatos Conversas Negocios Tarefas Dashboard │
└─────────────────────────────────────┘
```

#### Codigo

```tsx
<nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
  <div className="flex items-center justify-around h-14">
    {mainModules.map(module => (
      <Link
        key={module.id}
        href={module.href}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full text-xs",
          isActive(module.href)
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        <module.icon className="w-5 h-5 mb-1" />
        <span>{module.label}</span>
      </Link>
    ))}
  </div>
</nav>
```

**Nota:** Se usar Bottom Nav, adicionar `pb-[72px] md:pb-0` ao Content para compensar.

---

### 11.7 Content Area

#### Especificacoes

| Propriedade | Valor |
|-------------|-------|
| Margin Top | 104px (Header 56px + Toolbar 48px) |
| Padding | `p-4 lg:p-6` |
| Max Width | `1920px` centralizado |
| Min Height | `calc(100vh - 104px)` |

#### Codigo

```tsx
<main className="mt-[104px] min-h-[calc(100vh-104px)] p-4 lg:p-6">
  <div className="max-w-[1920px] mx-auto">
    {children}
  </div>
</main>
```

---

### 11.8 Estados de Navegacao

#### Item de Navegacao

| Estado | Header Nav | Toolbar Action |
|--------|------------|----------------|
| Default | `text-muted-foreground` | `variant="outline"` |
| Hover | `bg-muted text-foreground` | `bg-muted` |
| Ativo | `bg-primary text-primary-foreground` | `bg-muted text-foreground` |
| Focus | `ring-2 ring-ring` | `ring-2 ring-ring` |

#### Transicoes

```css
.nav-item {
  transition: background-color 150ms ease-out, color 150ms ease-out;
}
```

---

### 11.9 Touch Targets e Acessibilidade

#### Touch Targets Minimos

| Elemento | Tamanho Minimo | Observacao |
|----------|----------------|------------|
| Nav Item | 44x44px | Padding incluso |
| Icon Button | 40x40px | `size="icon"` |
| CTA Button | 44x36px | `size="sm"` |
| Bottom Nav Item | 48x48px | Area de toque |

#### Espacamento entre Touch Targets

- Minimo 8px entre elementos clicaveis adjacentes

#### ARIA e Semantica

```tsx
{/* Header */}
<header role="banner">
  <nav role="navigation" aria-label="Navegacao principal">
    {/* ... */}
  </nav>
</header>

{/* Toolbar */}
<div role="toolbar" aria-label="Acoes do modulo">
  {/* ... */}
</div>

{/* Main */}
<main role="main" aria-label="Conteudo principal">
  {/* ... */}
</main>

{/* Bottom Nav */}
<nav role="navigation" aria-label="Navegacao mobile">
  {/* ... */}
</nav>
```

---

### 11.10 Breadcrumb

```tsx
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2 text-sm">
    <li><a href="/" className="text-muted-foreground hover:text-foreground">Home</a></li>
    <li><ChevronRight className="w-4 h-4 text-muted-foreground" /></li>
    <li><a href="/contatos" className="text-muted-foreground hover:text-foreground">Contatos</a></li>
    <li><ChevronRight className="w-4 h-4 text-muted-foreground" /></li>
    <li className="text-foreground font-medium">Joao Silva</li>
  </ol>
</nav>
```

### 11.11 Paginacao

```tsx
<nav aria-label="Paginacao" className="flex items-center gap-2">
  <Button variant="outline" size="sm" disabled>
    <ChevronLeft className="w-4 h-4" />
  </Button>
  <span className="text-sm text-muted-foreground">
    Pagina 1 de 10
  </span>
  <Button variant="outline" size="sm">
    <ChevronRight className="w-4 h-4" />
  </Button>
</nav>
```

---

### 11.12 Checklist de Implementacao - Navegacao

- [ ] Header fixo com z-index 100
- [ ] Header altura 56px
- [ ] Header com logo, nav items, actions, user menu
- [ ] Nav items com estados (default, hover, active)
- [ ] Hamburger menu para mobile (<768px)
- [ ] Toolbar sticky com z-index 50
- [ ] Toolbar altura 48px
- [ ] Toolbar com context info, sub-nav, actions, CTA
- [ ] Actions overflow menu para mobile/tablet
- [ ] CTA com label responsivo (icon-only no mobile)
- [ ] Bottom nav opcional para mobile
- [ ] Touch targets 44px minimo
- [ ] Transicoes 150ms
- [ ] ARIA labels corretos
- [ ] Testado em 360px, 768px, 1024px, 1280px

---

## 12. Formularios

### 12.1 Layout

| Layout | Uso |
|--------|-----|
| Single column | Formularios simples, mobile |
| Two columns | Formularios medios em desktop |
| Sections | Formularios complexos |

### 12.2 Espacamento

```tsx
// Entre campos
<div className="space-y-4">
  <FormField />
  <FormField />
</div>

// Entre secoes
<div className="space-y-8">
  <section>...</section>
  <section>...</section>
</div>
```

### 12.3 Validacao

| Momento | Comportamento |
|---------|---------------|
| On blur | Validar campo individual |
| On submit | Validar todos os campos |
| On change (apos erro) | Revalidar campo com erro |

### 12.4 Mensagens de Erro

```tsx
// Inline
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    className="border-destructive"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-xs text-destructive flex items-center gap-1">
    <AlertCircle className="w-3 h-3" />
    Email invalido
  </p>
</div>
```

### 12.5 Campos Obrigatorios

```tsx
<Label htmlFor="nome">
  Nome <span className="text-destructive">*</span>
</Label>
```

### 12.6 Helper Text

```tsx
<p className="text-xs text-muted-foreground">
  Minimo 8 caracteres
</p>
```

---

## 13. Estados de Feedback

### 13.1 Loading States

#### Skeleton

```tsx
// Card skeleton
<div className="animate-pulse">
  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
  <div className="h-4 bg-muted rounded w-1/2" />
</div>
```

#### Spinner

```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

#### Button Loading

```tsx
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Carregando...
</Button>
```

### 13.2 Empty State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
    <Inbox className="w-6 h-6 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-semibold mb-1">Nenhum contato</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Comece adicionando seu primeiro contato
  </p>
  <Button>
    <Plus className="w-4 h-4 mr-2" />
    Criar contato
  </Button>
</div>
```

### 13.3 Error State

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
    <AlertCircle className="w-6 h-6 text-red-600" />
  </div>
  <h3 className="text-lg font-semibold mb-1">Erro ao carregar</h3>
  <p className="text-sm text-muted-foreground mb-4">
    Nao foi possivel carregar os dados
  </p>
  <Button variant="outline" onClick={retry}>
    <RefreshCw className="w-4 h-4 mr-2" />
    Tentar novamente
  </Button>
</div>
```

### 13.4 Success Feedback

- Toast para acoes bem-sucedidas
- Redirect automatico apos create/update
- Highlight temporario em item atualizado

---

## 14. Animacoes e Transicoes

### 14.1 Duracoes

| Token | Valor | Uso |
|-------|-------|-----|
| `duration-75` | 75ms | Micro-interacoes |
| `duration-150` | 150ms | Hovers, toggles |
| `duration-200` | 200ms | **Padrao** |
| `duration-300` | 300ms | Modais, drawers |
| `duration-500` | 500ms | Transicoes de pagina |

### 14.2 Easing

| Token | Valor | Uso |
|-------|-------|-----|
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Saida |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | **Entrada (padrao)** |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Movimento |

### 14.3 Animacoes Padrao

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Scale In */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Slide Up */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Spin */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### 14.4 Uso em Componentes

| Componente | Animacao |
|------------|----------|
| Modal (entrada) | Scale In + Fade In |
| Toast (entrada) | Slide Up + Fade In |
| Dropdown | Fade In |
| Skeleton | Pulse |
| Loading spinner | Spin |
| Hover card | Translate Y -2px |

---

## 15. Acessibilidade

### 15.1 Requisitos Minimos

| Criterio | Requisito |
|----------|-----------|
| Contraste | 4.5:1 texto, 3:1 UI |
| Focus visible | Todos elementos interativos |
| Navegacao teclado | Tab, Enter, Escape, Arrows |
| Screen reader | Labels e roles corretos |
| Motion | Respeitar `prefers-reduced-motion` |

### 15.2 Focus States

```css
/* Estilo de foco padrao */
.focus-visible:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Nunca remover outline sem alternativa */
:focus {
  outline: none; /* ERRADO */
}
```

### 15.3 ARIA Patterns

#### Botoes

```tsx
<button aria-label="Fechar modal">
  <X className="w-4 h-4" />
</button>
```

#### Modais

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
```

#### Alertas

```tsx
<div role="alert" aria-live="polite">
  Operacao concluida com sucesso
</div>
```

#### Loading

```tsx
<div aria-busy="true" aria-live="polite">
  Carregando...
</div>
```

### 15.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 15.5 Navegacao por Teclado

| Tecla | Acao |
|-------|------|
| Tab | Proximo elemento focavel |
| Shift + Tab | Elemento focavel anterior |
| Enter | Ativar botao/link |
| Escape | Fechar modal/popover |
| Arrow Up/Down | Navegar em listas/menus |
| Home/End | Primeiro/ultimo item |

---

## 16. Checklist de Implementacao

### 16.1 Foundations

- [ ] Variaveis CSS configuradas (`--primary`, `--secondary`, etc)
- [ ] Tailwind config com cores e espacamentos
- [ ] Fonte Inter carregada
- [ ] Z-index scale implementada
- [ ] Breakpoints configurados

### 16.2 Componentes Core

- [ ] Button (todas variantes e tamanhos)
- [ ] Input, Textarea, Select
- [ ] Checkbox, Radio, Switch
- [ ] Badge
- [ ] Card
- [ ] Modal/Dialog
- [ ] Popover
- [ ] Tooltip
- [ ] Toast/Sonner
- [ ] Tabs
- [ ] Table

### 16.3 Layout

- [ ] Sidebar responsiva
- [ ] Header com navegacao
- [ ] Breadcrumb
- [ ] Paginacao
- [ ] Empty states
- [ ] Loading states
- [ ] Error states

### 16.4 Formularios

- [ ] Labels com indicador de obrigatorio
- [ ] Helper text
- [ ] Mensagens de erro inline
- [ ] Validacao on blur e on submit
- [ ] Button loading state

### 16.5 Acessibilidade

- [ ] Contraste verificado (WCAG AA)
- [ ] Focus visible em todos interativos
- [ ] ARIA labels em icones
- [ ] Role e aria-modal em dialogs
- [ ] Navegacao por teclado testada
- [ ] Screen reader testado

### 16.6 Responsividade

- [ ] Mobile 360px testado
- [ ] Tablet 768px testado
- [ ] Desktop 1280px testado
- [ ] Full HD 1920px testado

---

## Referencias

- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [WCAG 2.2](https://www.w3.org/WAI/WCAG22/quickref/)
- [Material Design 3](https://m3.material.io/)
- [Atlassian Design System](https://atlassian.design/)
- [Carbon Design System](https://carbondesignsystem.com/)

---

**Este documento e um guia vivo. Atualize conforme o produto evolui.**
