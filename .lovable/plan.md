
# Plano: Otimizar UI do Editor de Formularios

## 1. Remover pincel duplicado da area de campos

Na imagem, ha dois pinceis: um no wrapper da area de campos (no `FormPreview.tsx`, linhas 274-291) e outro em cada `CampoItem`. O pincel do wrapper sera removido, mantendo apenas o pincel individual de cada campo.

**Arquivo:** `src/modules/formularios/components/editor/FormPreview.tsx`
- Remover o bloco do botao Paintbrush da area "Fields area" (linhas 274-291)
- Manter o outline de selecao no wrapper (quando `selectedStyleElement === 'campos'`)

---

## 2. Mover botoes para a linha do viewport switcher

Atualmente existem duas barras: a "style action bar" (Visualizar Final, CSS, Salvar Estilos) e a barra do viewport (Desktop, Tablet, Mobile). Serao unificadas em uma unica linha.

**Arquivo:** `src/modules/formularios/pages/FormularioEditorPage.tsx`
- Remover a div da "style action bar" (linhas 248-291)

**Arquivo:** `src/modules/formularios/components/editor/FormPreview.tsx`
- O componente recebera novas props: `onToggleFinalPreview`, `showFinalPreview`, `onToggleCss`, `showCssDrawer`, `onSaveEstilos`, `isSaving`
- Na barra do viewport switcher, adicionar a esquerda os botoes "Visualizar Final" e "CSS", e a direita o "Salvar Estilos"
- Layout: `[Visualizar Final | CSS] --- [Desktop | Tablet | Mobile] --- [Salvar Estilos]`

---

## 3. Consolidar abas Logica, Integracoes e A/B Testing dentro de Configuracoes

Reduzir de 7 abas para 4: **Campos | Configuracoes | Analytics | Compartilhar**

**Arquivo:** `src/modules/formularios/pages/FormularioEditorPage.tsx`
- Remover `logica`, `integracoes` e `ab` do array `TABS`
- Remover os blocos de renderizacao condicional dessas 3 abas

**Arquivo:** `src/modules/formularios/components/editor/EditorTabsConfig.tsx`
- Expandir para incluir sub-secoes com acordeao ou secoes empilhadas:
  - Secao "Configuracoes Gerais" (conteudo atual: Popup, Newsletter, Etapas)
  - Secao "Logica Condicional" (conteudo do `EditorTabsLogica`)
  - Secao "Integracoes" (conteudo do `EditorTabsIntegracoes`)
  - Secao "A/B Testing" (conteudo do `EditorTabsAB`)
- Cada secao tera um titulo clicavel com icone para expandir/recolher, seguindo o padrao visual existente

---

## Detalhes Tecnicos

### Arquivos modificados:
1. `src/modules/formularios/components/editor/FormPreview.tsx` - Remover pincel duplicado + adicionar botoes na barra de viewport
2. `src/modules/formularios/pages/FormularioEditorPage.tsx` - Remover action bar + remover abas consolidadas + passar props ao FormPreview
3. `src/modules/formularios/components/editor/EditorTabsConfig.tsx` - Integrar Logica, Integracoes e A/B como secoes internas

### Arquivos nao modificados (reutilizados como estao):
- `EditorTabsLogica.tsx` - Conteudo sera importado dentro de EditorTabsConfig
- `EditorTabsIntegracoes.tsx` - Idem
- `EditorTabsAB.tsx` - Idem

### Resultado final das abas:
```text
[Campos] [Configuracoes] [Analytics] [Compartilhar]
```

Dentro de "Configuracoes", secoes colapsaveis:
```text
> Geral (Popup, Newsletter, Etapas)
> Logica Condicional
> Integracoes
> A/B Testing
```
