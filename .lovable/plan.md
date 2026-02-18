
# Corrigir desconexao de espacamento entre Editor e Widget Embed

## Problema raiz

Existem duas logicas diferentes para calcular o espacamento entre campos:

- **Editor (FormPreview.tsx, CampoItem.tsx):** usa somente `validacoes.spacing_*`, com fallback para `'0'`
- **Widget embed (edge function):** usa `validacoes.spacing_*` -> `validacoes.estilo_campo.gap_*` -> `estilos_formularios.campos.gap_*`

O banco de dados mostra:
- Global: `gap_bottom: 40`, `gap_top: 0`
- Campos individuais: `estilo_campo.gap_bottom: 40` (gravado pelo "Aplicar a todos")
- `spacing_bottom`: vazio/ausente na maioria dos campos

O editor mostra espacamento 0 (porque ignora `estilo_campo.gap_*` e global), mas o widget embed usa 40px (porque cai no fallback `estilo_campo.gap_bottom: 40`).

## Solucao

Unificar a logica: o `getFieldPad` no widget embed deve seguir **exatamente** a mesma logica do editor frontend.

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**Linha 193** - Simplificar `getFieldPad` para usar apenas `validacoes.spacing_*` com fallback `'0'`, igual ao frontend:

De:
```js
function getFieldPad(c){
  var v=c.validacoes||{};
  var ec=v.estilo_campo||{};
  function pick(a,b,fb){...}
  var t=pick(v.spacing_top,ec.gap_top,gapTop);
  var r=pick(v.spacing_right,ec.gap_right,gapRight);
  var b=pick(v.spacing_bottom,ec.gap_bottom,gapBottom);
  var l=pick(v.spacing_left,ec.gap_left,gapLeft);
  return t+'px '+r+'px '+b+'px '+l+'px'
}
```

Para:
```js
function getFieldPad(c){
  var v=c.validacoes||{};
  function safe(x){return(x!==undefined&&x!==null&&x!=='')?x:'0'}
  return safe(v.spacing_top)+'px '+safe(v.spacing_right)+'px '+safe(v.spacing_bottom)+'px '+safe(v.spacing_left)+'px'
}
```

Isso garante que o widget embed use a mesma logica do editor: `validacoes.spacing_*` com fallback `'0'`. Sem camadas extras de `estilo_campo.gap_*` ou global `gap_*`.

Apos editar, fazer deploy da edge function `widget-formulario-loader`.
