

# Corrigir Estilos Individuais no Formulário Embed (Widget)

## Problema

O widget loader (`widget-formulario-loader`) ignora estilos individuais em dois cenarios:

1. **Campos de layout (titulo/paragrafo)**: Linhas 193-194 usam valores direto do `parseLayoutConfig()` sem verificar `campo.validacoes.estilo_campo`. No `FormPreview.tsx` isso ja foi corrigido, mas o widget embed nao acompanhou.

2. **Campos dentro de blocos de colunas**: A API `widget-formulario-config` nao retorna `pai_campo_id` nem `coluna_indice` na query (linha 54), fazendo com que a logica de colunas no loader nao consiga associar campos filhos aos blocos pai.

## Solucao

### 1. Atualizar `widget-formulario-config/index.ts`

Adicionar `pai_campo_id` e `coluna_indice` na query de campos (linha 54):

```text
.select('id, nome, label, tipo, obrigatorio, placeholder, ordem, opcoes, texto_ajuda, largura, etapa_numero, valor_padrao, validacoes, condicional_ativo, condicional_campo_id, condicional_operador, condicional_valor, pai_campo_id, coluna_indice')
```

### 2. Atualizar `widget-formulario-loader/index.ts`

Nas linhas 193-194, aplicar `mergeFieldStyle` nos campos `titulo` e `paragrafo`:

**Titulo (linha 193)** — antes:
```text
font-size:'+tc.tamanho+'px; ... color:'+tc.cor
```

**Titulo (depois):**
```text
var tFS=mergeFieldStyle(fS,c);
var tFontSize=tFS.label_tamanho||tc.tamanho+'px';
var tColor=tFS.label_cor||tc.cor;
var tWeight=tFS.label_font_weight||'600';
```
E usar essas variaveis no style do elemento.

**Paragrafo (linha 194)** — mesma logica:
```text
var pFS=mergeFieldStyle(fS,c);
var pFontSize=pFS.label_tamanho||pc.tamanho+'px';
var pColor=pFS.label_cor||pc.cor;
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/widget-formulario-config/index.ts` | Adicionar `pai_campo_id`, `coluna_indice` na query |
| `supabase/functions/widget-formulario-loader/index.ts` | Aplicar `mergeFieldStyle` em titulo e paragrafo |

### Deploy

Ambas as edge functions precisam ser re-deployadas apos as alteracoes.
