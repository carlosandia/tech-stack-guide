
## Corrigir popover de Tarefas do Contato (Chat)

### Problema
O popover de tarefas aparece distante do botao no mobile (`top-1/4`), sem overlay escuro, causando desconexao visual com o icone de tarefas no header do chat.

### Solucao
Aplicar o mesmo padrao usado nos popovers da toolbar de negocios:

**Mobile:**
- Overlay escuro cobrindo tela inteira (`fixed inset-0 bg-black/40`)
- Popover centralizado horizontalmente e proximo ao topo (`top-14` em vez de `top-1/4`)
- Largura `w-[calc(100vw-2rem)]` com `max-w-80`

**Desktop:**
- Manter posicionamento atual calculado pelo `getBoundingClientRect` do botao

### Alteracoes tecnicas

**Arquivo:** `src/modules/conversas/components/TarefasConversaPopover.tsx`

1. Substituir o overlay transparente por overlay escuro no mobile:
   - De: `<div className="fixed inset-0" style={{ zIndex: 590 }}>`
   - Para: `<div className="fixed inset-0 z-[590] bg-black/40 sm:bg-transparent">`

2. Substituir logica de posicionamento mobile no container do popover:
   - De: deteccao via `window.innerWidth < 640` com classes condicionais e inline styles
   - Para: classes responsivas com Tailwind (`fixed left-1/2 -translate-x-1/2 top-14 w-[calc(100vw-2rem)] max-w-80` no mobile, `sm:left-auto sm:translate-x-0 sm:top-auto sm:w-80` no desktop com inline styles apenas para desktop)

3. Remover `calcPos` para mobile (manter apenas para desktop), simplificando a logica de `window.innerWidth`

4. Usar `bg-card` em vez de `backgroundColor: 'white'` inline para consistencia com tema
