
# Corrigir Estilizacao do Widget Embed para Espelhar o Visualizador Final

## Problemas Identificados

Analisei os dados reais do banco e o codigo do `widget-formulario-loader`. Ha 3 bugs que causam divergencia entre o editor preview e o widget embed:

### 1. Cor do titulo/paragrafo ignorada
O titulo tem `valor_padrao` com `cor: "#0b64f4"` (azul). Porem, no widget (linha 193), a logica faz:
```
var tColor = tFS.label_cor || tc.cor;
```
O `tFS` e o merge do estilo global dos campos (`fS`) com `estilo_campo`. Como o estilo global `fS.label_cor = "#374151"` (cinza escuro) existe, ele **sempre** prevalece sobre a cor do `valor_padrao`, mesmo que o campo titulo nao tenha override individual de `label_cor`.

**Correcao**: Para campos de layout (titulo/paragrafo), a prioridade deve ser:
1. `estilo_campo.label_cor` (override individual) -- se existir
2. `tc.cor` (cor do valor_padrao do layout) -- cor configurada para aquele titulo
3. `fS.label_cor` (global) -- fallback

### 2. Tamanho da fonte sem unidade CSS
O `label_tamanho` do titulo e "30" (sem "px"). No widget, nao ha `ensurePx()` aplicado ao font-size do titulo:
```
var tFontSize = tFS.label_tamanho || tc.tamanho + 'px';
```
Quando `tFS.label_tamanho = "30"`, o CSS recebe `font-size:30` que e invalido. O navegador ignora.

**Correcao**: Aplicar `ensurePx()` ao font-size.

### 3. Espacamento individual por campo nao aplicado
O widget usa `fieldPadding` global (de `fS.gap_top`, `fS.gap_bottom`) para todos os campos. Porem, cada campo pode ter `validacoes.spacing_top`, `spacing_bottom`, etc., como overrides individuais. O widget ignora esses valores.

Exemplo: o titulo tem `spacing_bottom: "30"` mas o widget aplica o global `gap_bottom: "40"`.

**Correcao**: Antes de renderizar cada campo, ler `validacoes.spacing_*` e montar padding individual.

## Alteracoes Tecnicas

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**A) Adicionar funcao `fieldPad` para spacing individual** (antes do loop de campos):
- Criar funcao JS inline que le `c.validacoes.spacing_top/right/bottom/left` e usa como override do `fieldPadding` global

**B) Corrigir titulo (linha 193)**:
- Font size: aplicar `ensurePx()` em `tFS.label_tamanho`
- Cor: verificar se `estilo_campo` tem `label_cor` explicitamente antes de usar `tFS.label_cor`, senao usar `tc.cor`

**C) Corrigir paragrafo (linha 194)**:
- Mesma logica de cor e font-size do titulo

**D) Aplicar spacing individual a todos os campos**:
- Substituir `fieldPadding` fixo por chamada a `fieldPad(c)` para cada campo no loop

### Deploy
Apos as alteracoes, sera necessario fazer deploy da edge function `widget-formulario-loader`. O cache do script e de 1h, entao os sites que ja carregaram verao a mudanca apos o cache expirar (ou com `?nocache=1`).
