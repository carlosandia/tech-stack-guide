
# Plano de Implementacao - Fase 0: Alinhamento ao Design System

## Visao Geral

Este plano foca em **corrigir e alinhar** o frontend existente ao Design System documentado (`docs/designsystem.md`). Todo o backend já está implementado e as conexões já existem - o problema atual é que os **tokens CSS não estão corretos** e alguns componentes usam cores hardcoded.

---

## Problema Identificado

O arquivo `src/index.css` possui tokens CSS **incorretos** em relação ao Design System:

| Token | Valor Atual (ERRADO) | Valor Correto (Design System) | Resultado Visual |
|-------|---------------------|-------------------------------|------------------|
| `--primary` | `222.2 47.4% 11.2%` (cinza escuro) | `221.2 83.2% 53.3%` (azul #3B82F6) | Botões e CTAs escuros |
| `--ring` | `222.2 84% 4.9%` (preto) | `221.2 83.2% 53.3%` (azul) | Focus ring invisível |
| `--radius` | `0.5rem` (8px) | `0.75rem` (12px) | Border radius menor |

Alem disso, varios componentes usam cores hardcoded (`blue-600`, `blue-500`) ao inves de usar as classes semanticas do Tailwind (`bg-primary`, `text-primary`).

---

## ETAPA 1: Corrigir Tokens CSS (index.css)

**Arquivo:** `src/index.css`

### Alteracoes

```css
:root {
  /* Valores CORRETOS conforme Design System */
  --primary: 221.2 83.2% 53.3%;        /* #3B82F6 - Azul */
  --primary-foreground: 0 0% 100%;     /* #FFFFFF - Branco */
  --ring: 221.2 83.2% 53.3%;           /* Igual ao primary */
  --radius: 0.75rem;                   /* 12px */
}
```

---

## ETAPA 2: Refatorar LoginForm.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/auth/components/LoginForm.tsx`

### Problemas Atuais
- Linha 92: `focus:ring-blue-500` → deveria ser `focus:ring-primary`
- Linha 115: `focus:ring-blue-500` → deveria ser `focus:ring-primary`
- Linha 144: `text-blue-600` → deveria ser `text-primary`
- Linha 162: `bg-blue-600 hover:bg-blue-700` → deveria ser `bg-primary hover:bg-primary/90`
- Linha 179: `text-blue-600` → deveria ser `text-primary`

### Resultado Esperado
- Inputs com focus ring usando a cor primary correta
- Botão principal com cor primary (azul)
- Links com cor primary

---

## ETAPA 3: Refatorar ForgotPasswordPage.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/auth/pages/ForgotPasswordPage.tsx`

### Problemas Atuais
- Linha 79: `text-blue-600` → `text-primary`
- Linha 109: `focus:ring-blue-500` → `focus:ring-primary`
- Linha 125: `bg-blue-600 hover:bg-blue-700` → `bg-primary hover:bg-primary/90`
- Linha 145: `text-blue-600` → `text-primary`

---

## ETAPA 4: Refatorar ResetPasswordPage.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/auth/pages/ResetPasswordPage.tsx`

### Problemas Atuais
- Linha 146: `focus:ring-blue-500` → `focus:ring-primary`
- Linha 195: `focus:ring-blue-500` → `focus:ring-primary`
- Linha 235: `bg-blue-600 hover:bg-blue-700` → `bg-primary hover:bg-primary/90`
- Linha 256: `text-blue-600` → `text-primary`

---

## ETAPA 5: Refatorar OrganizacoesPage.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/admin/pages/OrganizacoesPage.tsx`

### Problemas Atuais
- Linha 78: `bg-primary-600 hover:bg-primary-700` → `bg-primary hover:bg-primary/90`
- Linha 95: `focus:ring-primary-500 focus:border-primary-500` → `focus:ring-primary focus:border-primary`
- Linha 104: `focus:ring-primary-500 focus:border-primary-500` → `focus:ring-primary focus:border-primary`

**Nota:** As classes `primary-600`, `primary-500` nao existem por padrao no Tailwind com CSS variables. Devemos usar `primary` diretamente.

---

## ETAPA 6: Refatorar DashboardPage.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/admin/pages/DashboardPage.tsx`

### Problemas Atuais
- Linha 176: `bg-primary-600` → `bg-primary`

---

## ETAPA 7: Refatorar AdminLayout.tsx - Usar Tokens Semanticos

**Arquivo:** `src/modules/admin/layouts/AdminLayout.tsx`

### Problemas Atuais
O layout usa cores hardcoded do Tailwind (`gray-900`, `gray-800`, `primary-600`) em vez de tokens semanticos.

### Alteracoes
- Sidebar background: manter `bg-gray-900` (design dark para sidebar esta ok)
- Badge Super Admin: manter `bg-purple-500/20 text-purple-300` (intencional)
- Navigation items ativos: `bg-primary-600` → `bg-primary`

---

## Resumo das Alteracoes

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/index.css` | Corrigir tokens CSS (primary, ring, radius) |
| `src/modules/auth/components/LoginForm.tsx` | Substituir blue-* por primary |
| `src/modules/auth/pages/ForgotPasswordPage.tsx` | Substituir blue-* por primary |
| `src/modules/auth/pages/ResetPasswordPage.tsx` | Substituir blue-* por primary |
| `src/modules/admin/pages/OrganizacoesPage.tsx` | Substituir primary-* por primary |
| `src/modules/admin/pages/DashboardPage.tsx` | Substituir primary-* por primary |
| `src/modules/admin/layouts/AdminLayout.tsx` | Substituir primary-* por primary |

---

## Secao Tecnica

### Padrao de Cores do Design System

| Classe Tailwind | CSS Variable | Uso |
|-----------------|--------------|-----|
| `bg-primary` | `--primary` | Background de botões primários, CTAs |
| `text-primary` | `--primary` | Links, texto interativo |
| `ring-primary` | `--ring` | Focus ring em inputs |
| `border-primary` | `--primary` | Bordas de destaque |
| `bg-primary/90` | `--primary` com opacity | Hover state de botões |
| `bg-destructive` | `--destructive` | Botões de exclusão, erros |

### Classes Corretas para Componentes

**Botao Primario:**
```jsx
className="bg-primary text-primary-foreground hover:bg-primary/90"
```

**Input com Focus:**
```jsx
className="focus:ring-2 focus:ring-primary focus:border-primary"
```

**Link:**
```jsx
className="text-primary hover:underline"
```

---

## Criterios de Aceitacao

- [ ] Botoes primarios exibem cor azul (#3B82F6)
- [ ] Focus ring em inputs exibe cor azul
- [ ] Border radius de cards e modais e 12px
- [ ] Nenhum componente usa cores hardcoded (blue-500, blue-600, etc)
- [ ] Todas as cores interativas usam tokens semanticos

---

## Proximos Passos Apos Aprovacao

1. Aplicar correções nos tokens CSS
2. Refatorar componentes para usar tokens semânticos
3. Testar visualmente todas as páginas de auth
4. Testar páginas do admin
