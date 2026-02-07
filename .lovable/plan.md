

# Correção do Flickering no Drag and Drop de Etapas

## Problema Identificado

O componente `ConfigEtapas.tsx` usa `etapasVisuais` para reordenar os elementos do DOM durante o drag. Quando o React re-renderiza a lista em uma nova ordem, os elementos mudam de posição no DOM, o que faz o browser disparar novos eventos `dragEnter` no elemento que agora está sob o cursor. Isso atualiza `overId`, que recalcula `etapasVisuais`, que re-renderiza, que dispara outro `dragEnter`... criando o loop de flickering.

## Solucao

Em vez de reordenar o array e mover elementos no DOM, vamos:

1. **Sempre renderizar `etapasOrdenadas`** (ordem estável, DOM nunca muda)
2. **Usar CSS `transform: translateY()`** para deslocar itens visualmente com animacao suave
3. **Calcular o deslocamento** baseado na posicao do `dragId` e `overId`

Assim o DOM fica estático durante o drag, eliminando o feedback loop.

## Detalhes Técnicos

### Mudancas no `ConfigEtapas.tsx`

**1. Remover `etapasVisuais`** - nao sera mais necessário

**2. Renderizar sempre `etapasOrdenadas`** - a lista base que nao muda durante drag

**3. Criar funcao `getItemStyle()`** que calcula o `transform` de cada item:
- O item sendo arrastado: `opacity: 0.4, pointer-events: none`
- Se arrastando para baixo (dragIdx menor que overIdx): itens entre drag+1 e over recebem `translateY(-itemHeight)` (sobem)
- Se arrastando para cima (dragIdx maior que overIdx): itens entre over e drag-1 recebem `translateY(+itemHeight)` (descem)
- Todos os itens ganham `transition: transform 150ms ease` para animacao suave

**4. Usar ref para a altura do item** - medir a altura real de um item no DOM para calcular o `translateY` com precisao, ou usar valor fixo (~52px que e a altura padrao de cada linha)

**5. Adicionar `pointer-events: none` nos filhos durante drag** - evitar que elementos internos (botoes, icones) interceptem eventos de drag

**6. Estabilizar `onDragEnter`** - usar ref para comparar o overId anterior e so atualizar state se realmente mudou

### Resultado esperado

- Ao arrastar "Contatado" sobre "Agendado", o Agendado desliza suavemente para a posicao de Contatado
- Sem flickering porque o DOM nao muda de ordem
- A animacao e fluida (150ms ease) como no Trello
- Ao soltar, a lista persiste a nova ordem no banco

