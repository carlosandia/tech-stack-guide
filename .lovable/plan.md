
# Plano de Correção: Exclusão de Pipeline e Dropdown do Usuário

## Problema 1: Exclusão de Pipeline não funciona

### Causa Raiz
O modal de confirmação de exclusão é renderizado via `ReactDOM.createPortal` no `document.body`, fora do `containerRef` do PipelineSelector. O handler de click-outside usa `mousedown` no document, que dispara **antes** do `click` no botão "Excluir". Sequência:

1. Usuário clica em "Excluir" no modal
2. `mousedown` dispara no document -> handler detecta clique fora do `containerRef` -> `setConfirmDelete(null)` + `setOpen(false)`
3. `click` dispara no botão -> `handleConfirmExcluir` roda, mas `confirmDelete` já é `null` -> `return` imediato

### Correção
No handler de click-outside (`PipelineSelector.tsx`, linhas 44-56), ignorar cliques quando `confirmDelete` estiver ativo, ou verificar se o clique é dentro do portal do modal de confirmação.

```text
Arquivo: src/modules/negocios/components/toolbar/PipelineSelector.tsx

Alterar o useEffect de click-outside para:
- Se confirmDelete estiver ativo, não fechar nada
- Ou usar uma ref no modal para excluir cliques nele
```

---

## Problema 2: Dropdown do usuário com transparência

### Causa Raiz
O dropdown está dentro do `<header>` que tem `bg-white/80 backdrop-blur-md` (glass effect). Embora o dropdown use `bg-card` (branco sólido via HSL), visualmente o backdrop-blur do header pai pode interferir. A solução segura é usar `bg-white` inline diretamente.

### Correção
No `AppLayout.tsx` (linha 322), trocar `bg-card` por `bg-white` para garantir fundo branco sólido independente do contexto CSS.

Mesma correção no `ConfigHeader.tsx` e `AdminLayout.tsx`.

---

## Arquivos a Modificar

1. **`src/modules/negocios/components/toolbar/PipelineSelector.tsx`**
   - Alterar click-outside handler para ignorar cliques quando o modal de confirmação estiver aberto

2. **`src/modules/app/layouts/AppLayout.tsx`**
   - Trocar `bg-card` por `bg-white` no dropdown do user menu

3. **`src/modules/configuracoes/components/layout/ConfigHeader.tsx`**
   - Trocar `bg-card` por `bg-white` no dropdown do user menu

4. **`src/modules/admin/layouts/AdminLayout.tsx`**
   - Trocar `bg-card` por `bg-white` no dropdown do user menu
