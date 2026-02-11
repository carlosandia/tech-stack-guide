

# Plano: Configuracoes de Layout para Paragrafo e demais campos

## Resumo

O campo "Paragrafo" vai ganhar os mesmos controles visuais que o "Titulo" (alinhamento, cor, tamanho da fonte). Alem disso, os campos de layout "Divisor", "Espacador" e "Bloco HTML" ganharao configuracoes proprias e funcionais.

---

## 1. Paragrafo - mesmas configs do Titulo

O painel de configuracao (`CampoConfigPanel`) passara a tratar `paragrafo` da mesma forma que `titulo`, exibindo:
- **Alinhamento** (esquerda, centro, direita)
- **Cor do texto** (input color + hex)
- **Tamanho da fonte** (px)

Os valores serao armazenados em JSON no campo `valor_padrao`, identico ao titulo.

Arquivos afetados:
- `CampoConfigPanel.tsx` - expandir condicao `isTitulo` para incluir `paragrafo` (renomear para `isLayoutTexto` ou similar)
- `FormPreview.tsx` - aplicar `parseTituloConfig` no render do paragrafo
- `CampoItem.tsx` - aplicar estilos no preview do paragrafo na paleta
- `FormularioPublicoPage.tsx` - aplicar estilos no render publico do paragrafo

## 2. Divisor - configuracoes proprias

Controles no painel:
- **Cor da linha** (input color)
- **Espessura** (1px a 5px)
- **Estilo** (solido, tracejado, pontilhado)

Armazenamento: JSON em `valor_padrao` com `{"cor":"#D1D5DB","espessura":"1","estilo":"solid"}`

Arquivos afetados:
- `CampoConfigPanel.tsx` - secao condicional para `divisor`
- `FormPreview.tsx` - aplicar estilos no `<hr>`
- `CampoItem.tsx` - aplicar estilos no preview
- `FormularioPublicoPage.tsx` - aplicar estilos no render publico

## 3. Espacador - configuracao propria

Controle no painel:
- **Altura** (input numerico, de 8px a 120px, padrao 16px)

Armazenamento: JSON em `valor_padrao` com `{"altura":"16"}`

Arquivos afetados: mesmos 4 arquivos

## 4. Bloco HTML - configuracao propria

Controle no painel:
- **Conteudo HTML** (textarea grande para colar HTML)

Ja usa `valor_padrao` como string HTML direta, entao nao precisa de JSON - apenas exibir um textarea adequado no painel.

Arquivo afetado: `CampoConfigPanel.tsx` - secao condicional para `bloco_html`

## 5. Remocao de campos irrelevantes para tipos de layout

Para campos de layout (`titulo`, `paragrafo`, `divisor`, `espacador`, `bloco_html`), ocultar configs que nao fazem sentido:
- Placeholder (ja oculto para titulo, agora tambem para divisor, espacador)
- Texto de ajuda (idem)
- Obrigatorio (nao faz sentido para layout)
- Mapeamento para contato (idem)
- Largura (manter apenas para titulo e paragrafo)

---

## Detalhes tecnicos

### Helper generico de parsing

Renomear `parseTituloConfig` para `parseLayoutConfig` e expandir para suportar todos os campos:

```text
parseLayoutConfig(valorPadrao, tipo):
  - titulo/paragrafo: { alinhamento, cor, tamanho }
  - divisor: { cor, espessura, estilo }
  - espacador: { altura }
  - bloco_html: valor_padrao usado como string direta (sem parse)
```

### Logica no CampoConfigPanel

```text
const isTextoLayout = tipo === 'titulo' || tipo === 'paragrafo'
const isDivisor = tipo === 'divisor'
const isEspacador = tipo === 'espacador'
const isBlocoHtml = tipo === 'bloco_html'
const isLayoutField = isTextoLayout || isDivisor || isEspacador || isBlocoHtml

- Se isLayoutField: ocultar placeholder, texto_ajuda, obrigatorio, mapeamento
- Se isTextoLayout: mostrar alinhamento + cor + tamanho
- Se isDivisor: mostrar cor da linha + espessura + estilo
- Se isEspacador: mostrar altura
- Se isBlocoHtml: mostrar textarea de HTML
- Largura: mostrar para titulo, paragrafo, imagem_link; ocultar para divisor, espacador, bloco_html
```

### buildPayload atualizado

O `valor_padrao` sera serializado como JSON para titulo, paragrafo, divisor e espacador. Para bloco_html, sera a string HTML direta.

### Sequencia de implementacao

1. Refatorar `CampoConfigPanel.tsx` (helper + secoes condicionais + ocultar campos irrelevantes)
2. Atualizar `FormPreview.tsx` (aplicar estilos de paragrafo, divisor, espacador)
3. Atualizar `CampoItem.tsx` (preview na paleta)
4. Atualizar `FormularioPublicoPage.tsx` (render publico)

