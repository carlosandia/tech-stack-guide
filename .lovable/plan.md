
# Plano: Reorganizar EstiloCamposForm - Layout Compacto

## Objetivo
Reorganizar o painel de estilos dos campos/inputs para ficar compacto, facil de ler e usar, seguindo o mesmo padrao visual do painel de botoes (grids de 2 colunas, secoes claras).

## Mudancas

### 1. Reorganizacao do Layout (EstiloCamposForm.tsx)

Novo layout compacto com grids de 2 colunas:

```text
LABEL
  [Cor ____] [Tamanho ____]     <- grid 2 colunas
  [Peso ____v]                  <- novo: peso da fonte (Normal, Semibold, Bold)

CORES DO INPUT
  [Fundo ____] [Texto ____]     <- grid 2 colunas
  [Placeholder ____]            <- linha unica (label mais longo)

BORDA DO INPUT
  [Arredondamento __] [Espessura __]  <- grid 2 colunas
  [Estilo ____v] [Cor ____]           <- grid 2 colunas (novo: estilo solid/dashed/dotted)

DIMENSOES
  [Altura ____]                 <- novo: altura do input (px)

FOCO
  [Cor do Foco ____]            <- novo: cor do ring ao focar no input

ERRO
  [Cor de Erro ____]

ESPACAMENTO
  [Topo __] [Baixo __]          <- grid 2 colunas (ja existe)
  [Esquerda __] [Direita __]    <- grid 2 colunas (ja existe)
```

### 2. Novos campos adicionados ao EstiloCampos

Para dar autonomia total ao usuario, adicionar na interface `EstiloCampos` em `formularios.api.ts`:
- `label_font_weight` - peso da fonte do label (normal, 500, 600, 700)
- `input_height` - altura do input
- `input_border_style` - estilo da borda (solid, dashed, dotted)
- `input_focus_color` - cor do ring de foco

### 3. Componente ColorField compacto

O `ColorField` atual ocupa muito espaco vertical (label em cima, color+input embaixo). Nova versao compacta: label acima e color picker menor (w-6 h-6) inline com o input hex.

### 4. Aplicacao dos novos estilos

Atualizar `FormPreview.tsx` e `FormularioPublicoPage.tsx` para aplicar os novos estilos:
- `input_height` no style do input
- `input_border_style` no style do input
- `input_focus_color` como ring color customizado
- `label_font_weight` no style do label

## Arquivos afetados

1. **`src/modules/formularios/services/formularios.api.ts`** - adicionar novos campos na interface EstiloCampos
2. **`src/modules/formularios/components/estilos/EstiloCamposForm.tsx`** - reescrever com layout compacto em grid
3. **`src/modules/formularios/components/editor/FormPreview.tsx`** - aplicar novos estilos nos inputs
4. **`src/modules/formularios/pages/FormularioPublicoPage.tsx`** - aplicar novos estilos nos inputs da pagina publica
