

# Corrigir paridade visual entre Editor Preview e Widget Embed

## Diagnostico completo

Apos investigacao profunda, identifiquei **3 problemas** que causam a diferenca visual entre o preview do editor e o widget embedado no site:

### Problema 1 — Cache CDN de 24 horas

O header `Cache-Control` atual e `max-age=3600, s-maxage=86400`. Mesmo apos deploy, o CDN pode servir a versao antiga por ate **24 horas**. Todas as correcoes anteriores podem nao estar refletindo no site por causa disso.

### Problema 2 — `ensurePx` nao aplicado no CSS global do widget

Na edge function, as propriedades globais `label_tamanho`, `input_height` e `input_border_radius` sao concatenadas diretamente sem `ensurePx`. Se o banco gravar valores numericos (sem `px`), o CSS gerado fica invalido (ex: `font-size:14` ao inves de `font-size:14px`).

Dados atuais do banco para este formulario:
- `label_tamanho: "14px"` (OK, ja tem unidade)
- `input_height: "40px"` (OK)
- `input_border_radius: "6px"` (OK)

Porem, como outros formularios podem ter valores numericos puros, a correcao deve ser aplicada preventivamente.

### Problema 3 — `selecao_multipla` renderiza diferente

No editor, `selecao_multipla` renderiza como um `<select>` dropdown com texto "Selecione uma ou mais...". No widget embed, renderiza como checkboxes individuais com bordas, ocupando muito mais espaco vertical. Isso causa uma grande diferenca visual no layout do formulario.

---

## Plano de correcao

### Arquivo: `supabase/functions/widget-formulario-loader/index.ts`

**Correcao 1 — Cache (linha 34)**

Reduzir o cache para 5 minutos:
```
De: 'Cache-Control': 'public, max-age=3600, s-maxage=86400'
Para: 'Cache-Control': 'public, max-age=300, s-maxage=300'
```

**Correcao 2 — ensurePx nas propriedades globais (linhas 186-187)**

Aplicar `ensurePx` em `input_border_radius`, `input_height` e `label_tamanho` nos CSS globais:

Linha 186 (inputCss):
```
De: border-radius:'+(fS.input_border_radius||'6px')+'  ...  height:'+(fS.input_height||'40px')+'
Para: border-radius:'+ensurePx(fS.input_border_radius,'6px')+'  ...  height:'+ensurePx(fS.input_height,'40px')+'
```

Linha 187 (labelCss):
```
De: font-size:'+(fS.label_tamanho||'14px')+'
Para: font-size:'+ensurePx(fS.label_tamanho,'14px')+'
```

**Correcao 3 — Renderizar `selecao_multipla` como dropdown igual ao editor (linha 106)**

Substituir a renderizacao de checkboxes individuais por um `<select multiple>` com as mesmas opcoes, espelhando o comportamento do editor preview.

De: checkboxes visuais com bordas e margin-bottom
Para: `<select>` com `appearance:auto` e opcoes, igual ao que o editor mostra

---

## Resumo

| Correcao | Linha | Impacto |
|----------|-------|---------|
| Cache 5min | 34 | Correcoes refletem rapido no site |
| ensurePx global | 186-187 | CSS valido para valores numericos |
| selecao_multipla como select | 106 | Renderizacao identica ao editor |

Apos editar, deploy da edge function `widget-formulario-loader`.

