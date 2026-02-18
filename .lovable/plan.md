
# Corrigir ensurePx no widget-formulario-loader para aceitar numeros

## Problema

O campo `estilo_campo.label_tamanho` esta salvo no banco como numero (`35`), nao como string (`"35"`). A funcao `ensurePx` no edge function `widget-formulario-loader` chama `.trim()` diretamente no valor recebido. Quando o valor e um numero, `(35).trim()` lanca TypeError, fazendo a funcao retornar o fallback (`18px`).

Dados do banco confirmam:
- `validacoes.estilo_campo.label_tamanho` = `35` (numero)
- `valor_padrao.tamanho` = `"18"` (string)

## Alteracao

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**Linha 55** - Alterar a funcao `ensurePx` para converter o valor para string antes de operar:

De:
```js
function ensurePx(v,fb){if(!v||!v.trim())return fb;var t=v.trim();if(/[a-z%]/i.test(t))return t;return t+'px'}
```

Para:
```js
function ensurePx(v,fb){if(v===undefined||v===null||v==='')return fb;var t=String(v).trim();if(!t)return fb;if(/[a-z%]/i.test(t))return t;return t+'px'}
```

Isso garante que valores numericos (35) sejam convertidos para string ("35") antes de processar, resultando em "35px" corretamente.

Apos editar, fazer deploy da edge function `widget-formulario-loader`.
