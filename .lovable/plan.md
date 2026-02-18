

# Unificar Preview do Editor com Visualizacao Final

## Objetivo

Substituir a renderizacao simplificada dos campos no editor (`CampoItem` com `renderFieldPreview`) pela renderizacao final real (`renderFinalCampo`), mantendo todos os controles de edicao (setas, duplicar, lixeira, engrenagem, badge de tipo, edicao inline de label).

## O que muda visualmente

- Campos de telefone ja mostram a bandeira e DDI
- Campo de avaliacao ja mostra as estrelas amarelas
- Inputs usam os estilos reais (cores, bordas, border-radius do estilo configurado)
- Selecao multipla, radio, NPS, slider etc. todos com aparencia final
- Sem bordas de "card" ao redor de cada campo (remover o `border rounded-lg p-3`)
- Sem a badge de tipo ao lado do label (remover "Texto", "Tel BR", etc.)

## O que permanece igual

- Hover mostra botoes: setas cima/baixo, duplicar, engrenagem, lixeira
- Click seleciona o campo (outline azul)
- Double-click no label edita inline
- Drag-and-drop para reordenar
- Drop zones entre campos

## Implementacao Tecnica

### 1. Modificar `CampoItem.tsx`

- Receber novas props: `estiloCampos`, `fontFamily` (para renderizar com estilos reais)
- Substituir chamada de `renderFieldPreview` por `renderFinalCampo` (importar do FormPreview ou extrair para um util)
- Remover o wrapper com `border rounded-lg p-3` e a Badge de tipo
- Manter apenas um wrapper fino com:
  - `outline` quando selecionado (sem borda permanente)
  - Botoes de controle no hover (absolutos)
  - Label editavel inline
- Manter o `draggable` e handlers de drag

### 2. Extrair `renderFinalCampo` para arquivo compartilhado

Criar `src/modules/formularios/utils/renderFinalCampo.tsx` com:
- A funcao `renderFinalCampo` (movida de FormPreview.tsx)
- A funcao `renderLabel`
- O componente `PhoneInputWithCountry`
- A constante `PAISES_COMUNS`

Isso permite que tanto `CampoItem` quanto `FinalPreviewFields` usem a mesma funcao.

### 3. Atualizar `FormPreview.tsx`

- Remover `showFinalPreview` toggle e o botao "Visualizar Final" da toolbar (nao precisa mais)
- Usar sempre o mesmo rendering para campos (que agora ja e o final)
- Manter o `FinalPreviewFields` wrapper apenas para gerenciar estado de mascaras interativas, mas agora usado diretamente no modo editor tambem
- Passar `estiloCampos` e `fontFamily` para cada `CampoItem`

### 4. Adaptar `BlocoColunasEditor.tsx`

- Passar as mesmas props de estilo para os `CampoItem` filhos dentro das colunas

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/modules/formularios/utils/renderFinalCampo.tsx` | **NOVO** - Funcao extraida de FormPreview |
| `src/modules/formularios/components/campos/CampoItem.tsx` | Usar renderFinalCampo, remover bordas/badges |
| `src/modules/formularios/components/editor/FormPreview.tsx` | Importar de renderFinalCampo, remover duplicacao |
| `src/modules/formularios/components/campos/BlocoColunasEditor.tsx` | Passar props de estilo |

### Riscos e Cuidados

- Manter a edicao inline do label funcional (ela sobrescreve o label renderizado pelo renderFinalCampo)
- Garantir que campos de layout (titulo, paragrafo, divisor, espacador) continuem editaveis
- Preservar drag-and-drop entre campos e nas drop zones
- Nao quebrar o CSS responsivo ja existente

