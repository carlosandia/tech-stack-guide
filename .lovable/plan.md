

# Plano: Corrigir Drop Zone no Layout de Popup com Imagem

## Problema Identificado

Nos layouts de popup com imagem lateral (ex: `imagem_esquerda`, `imagem_lateral_full`), o formulario e suas drop zones ficam confinados em um `div` com largura parcial (`w-3/5` ou `w-1/2`). Quando o usuario arrasta um campo da paleta, a drop zone so e ativada se o cursor estiver exatamente sobre essa area menor, nao sobre a imagem. Isso causa confusao pois visualmente parece que a drop zone deveria cobrir toda a largura.

Alem disso, o `formContent` (que contem as drop zones) e criado como uma variavel JSX e depois inserido dentro do wrapper do layout de popup. Isso causa um problema de "dupla renderizacao" conceitual: as drop zones sao corretamente posicionadas, mas o espaco visual disponivel e reduzido.

## Solucao

Tornar a area da imagem tambem receptiva a drops, delegando o evento para a drop zone mais proxima (a primeira, indice 0). Assim, quando o usuario arrastar um campo sobre a area da imagem, o drop sera aceito e o campo sera inserido no inicio do formulario.

## Alteracoes Tecnicas

### 1. `FormPreview.tsx` - Tornar area da imagem drop-friendly

Nos templates `imagem_esquerda`, `imagem_direita`, `imagem_lateral_full`, `imagem_topo`:

- Adicionar `onDragOver`, `onDragEnter`, `onDragLeave` e `onDrop` no `div` que contem o `imageEl`
- Esses eventos delegam para o indice 0 (primeira posicao dos campos), permitindo que o usuario solte campos sobre a imagem e eles sejam inseridos no formulario
- Adicionar feedback visual (borda tracejada) quando estiver arrastando sobre a area da imagem

### 2. `FormPreview.tsx` - Expandir area receptiva do formContent wrapper

- No `div` que envolve o `formContent` dentro dos layouts, adicionar `min-height` e garantir que o `overflow` nao corte a area de drop
- Garantir que a drop zone no topo (indice 0) tenha altura minima suficiente para ser facilmente acessivel

### 3. Simplificar nesting desnecessario

- Revisar se ha `div`s extras que limitam a area clicavel/arrastavel sem necessidade
- O `formContent` ja tem wrappers como `group/campos` que podem ser simplificados para reduzir aninhamento

## Resultado Esperado

- Arrastar um campo sobre a area da imagem do popup tambem ativa a drop zone
- A drop zone fica visualmente centralizada e alinhada com a area de campos
- A experiencia de drag-and-drop funciona de forma consistente independentemente do layout de popup selecionado

