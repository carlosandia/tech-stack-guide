

# Responsividade no Bloco de Colunas

## Problema

Atualmente o bloco de colunas usa `display: flex` com larguras fixas (ex: 33%/67%). No mobile, as colunas ficam espremidas lado a lado, estourando os campos (como visto na terceira imagem).

## Solucao (padrao de mercado - Elementor/WPBakery)

Adicionar campos `larguras_tablet` e `larguras_mobile` no JSON de configuracao do bloco (`valor_padrao`). O padrao de mercado e simples:

- **Desktop**: mantem a proporcao escolhida (ex: 33%/67%)
- **Tablet**: herda do desktop ou override (ex: 50%/50%)
- **Mobile**: por padrao empilha em 100%/100% (cada coluna vira uma linha)

O usuario pode customizar por dispositivo no painel de configuracao.

## O que muda

### 1. Painel de configuracao (`CampoConfigPanel.tsx`)

Adicionar um `DeviceSwitcher` na secao "Configuracao de Colunas". Quando o usuario selecionar Tablet ou Mobile, os botoes de proporcao editam `larguras_tablet` ou `larguras_mobile` no JSON. Indicadores visuais (bolinhas) mostram quando ha override.

```text
Proporcao  [Desktop] [Tablet] [Mobile]
  [50/50]  [33/67]  [67/33]  [25/75]

(No Mobile, preset adicional: [100 empilhado])
```

### 2. Estrutura de dados (`valor_padrao` JSON)

```json
{
  "colunas": 2,
  "larguras": "33%,67%",
  "larguras_tablet": "50%,50%",
  "larguras_mobile": "100%,100%",
  "gap": "16"
}
```

Nenhuma migration de banco necessaria -- e o mesmo campo JSONB existente.

### 3. Renderizacao responsiva (FormPreview + FormularioPublicoPage)

Gerar CSS com media queries usando a funcao `generateResponsiveCss` ja existente em `responsiveStyles.ts`. Cada bloco de colunas recebe um `data-bloco-id` unico e o CSS gerado:

```css
/* Desktop: inline styles normais (33%/67%) */

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  [data-bloco-id="abc123"] { flex-wrap: wrap; }
  [data-bloco-id="abc123"] > .col-0 { width: 50% !important; }
  [data-bloco-id="abc123"] > .col-1 { width: 50% !important; }
}

/* Mobile */
@media (max-width: 767px) {
  [data-bloco-id="abc123"] { flex-wrap: wrap; }
  [data-bloco-id="abc123"] > .col-0 { width: 100% !important; }
  [data-bloco-id="abc123"] > .col-1 { width: 100% !important; }
}
```

### 4. Default inteligente para Mobile

Quando `larguras_mobile` nao estiver definido, o sistema usara automaticamente `100%` para cada coluna (empilhamento vertical). Isso resolve o problema da imagem 3 imediatamente, mesmo para blocos ja existentes.

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `CampoConfigPanel.tsx` | Adicionar DeviceSwitcher na secao de colunas + presets por dispositivo |
| `FormPreview.tsx` | Gerar tag `<style>` com media queries para cada bloco de colunas |
| `FormularioPublicoPage.tsx` | Mesma logica de media queries na pagina publica |
| `responsiveStyles.ts` | Adicionar funcao `generateColunasResponsiveCss(blocoId, config)` |
| `BlocoColunasEditor.tsx` | Sem alteracao (editor mostra sempre desktop) |

## Comportamento final

- Blocos existentes sem config mobile: empilham automaticamente no mobile (100% cada coluna)
- Usuario pode personalizar proporcoes por dispositivo no painel lateral
- Preview no editor muda ao clicar Desktop/Tablet/Mobile no topo

