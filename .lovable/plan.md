

# Correcao: Icone (i) informativo no widget embed

## Problema
No preview do editor, o campo `texto_ajuda` (Instrucao para o Usuario) aparece como um icone (i) circular ao lado do label, com tooltip ao passar o mouse. No site final (widget embed servido pela Edge Function), o mesmo campo aparece como texto puro abaixo do input -- fora do padrao visual.

## Solucao
Alterar o arquivo `supabase/functions/widget-formulario-loader/index.ts` para renderizar `texto_ajuda` como um icone SVG (i) inline ao lado do label com `title` tooltip, igual ao preview.

## O que muda

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**1. Alterar a renderizacao do label (linha 78)**

Onde hoje cria apenas o texto do label, passar a incluir o icone (i) quando `c.texto_ajuda` existir:

```text
Antes:
label.textContent = c.label + (c.obrigatorio ? ' *' : '')

Depois:
label.style.cssText = labelCss + ';display:flex;align-items:center;gap:4px'
label.innerHTML = c.label + (c.obrigatorio ? ' <span style="color:#EF4444">*</span>' : '')
+ (c.texto_ajuda
    ? '<span title="' + c.texto_ajuda + '" style="cursor:help;display:inline-flex">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      + '</span>'
    : '')
```

**2. Remover os blocos de texto_ajuda como span abaixo do campo**

Em 4 locais do codigo, o `texto_ajuda` e renderizado como texto abaixo do campo. Esses blocos serao removidos:

- Linha 85 (telefone internacional) -- remover bloco `if(c.texto_ajuda){...}`
- Linha 88 (telefone BR) -- remover bloco `if(c.texto_ajuda){...}`
- Linha 97 (checkbox) -- remover bloco `if(c.texto_ajuda){...}`
- Linha 125 (fallback geral) -- remover bloco `if(c.texto_ajuda){...}`

**3. Corrigir labels de checkbox/checkbox_termos**

Os tipos `checkbox` e `checkbox_termos` pulam a criacao do label padrao (linha 78). Para esses, o icone (i) sera adicionado inline ao lado do texto do checkbox, usando a mesma logica de SVG + title.

### Resultado final
- O icone (i) aparecera ao lado do label, identico ao preview
- Ao passar o mouse, o texto de instrucao aparece como tooltip nativo
- Sem texto solto abaixo do campo
- Apos edicao, deploy da Edge Function `widget-formulario-loader`
