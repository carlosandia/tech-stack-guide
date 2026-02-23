
# Correcao: Formulario de demonstracao nao carrega no modal

## Problema identificado

O formulario de demonstracao aparece vazio (modal branco) por **duas causas raiz**:

### Causa 1: Edge Functions nao deployadas
As edge functions `widget-formulario-loader` e `widget-formulario-config` existem no codigo mas **nao estao deployadas** (retornam 404). O script que deveria ser carregado simplesmente nao existe no servidor.

### Causa 2: Injecao de script fragil dentro do Dialog
O codigo atual cria um `<script>` dinamicamente e insere dentro de um `<div>` gerenciado pelo React (dentro do `DialogContent`). Isso tem problemas:
- `document.currentScript` e `null` para scripts inseridos dinamicamente
- O fallback `querySelector` pode falhar dependendo do timing do React
- O widget usa `parent.insertBefore(div, el.nextSibling)` que depende do script estar no DOM

## Plano de correcao

### Passo 1: Deploy das Edge Functions
Deployar `widget-formulario-loader` e `widget-formulario-config` para que o script esteja acessivel via URL.

### Passo 2: Refatorar injecao do script no PricingSection
Substituir a abordagem de `appendChild(script)` por um `fetch` direto ao JS da edge function, seguido de `eval` ou `new Function()`, garantindo que o script execute no contexto correto.

Alternativa mais robusta: usar `fetch` para obter o JS como texto, criar um `Blob` e injetar como `<script src="blob:...">`, ou simplesmente usar um `<iframe>` apontando para uma pagina minima que carrega o widget.

**Abordagem escolhida**: Manter a injecao de script mas corrigir o timing - usar `setTimeout` maior e garantir que o container tenha um `id` especifico que o widget possa encontrar. Adicionar tambem `DialogTitle` (oculto com `VisuallyHidden`) para resolver o erro de acessibilidade no console.

### Detalhes tecnicos

**Arquivo: `src/modules/public/components/landing/PricingSection.tsx`**
- Adicionar `DialogTitle` com `VisuallyHidden` no modal de demonstracao
- Adicionar `aria-describedby={undefined}` no `DialogContent`
- Manter a logica de script injection mas garantir que o `demoContainerRef` tenha um ID unico para o widget encontrar

**Deploy:**
- `widget-formulario-loader`
- `widget-formulario-config`

Essas duas correcoes combinadas devem resolver o modal branco.
