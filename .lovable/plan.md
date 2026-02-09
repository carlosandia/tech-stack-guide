
# Plano: Edicao de Estilos Inline no Preview (Click-to-Edit)

## Conceito

Substituir o layout atual da tab Estilos (painel de configs esquerda + preview direita) por uma experiencia de edicao inline direta no preview. O usuario clica no container, em um campo, ou no botao para abrir um popover/painel lateral compacto com as opcoes de estilo daquele elemento especifico. Um botao "Visualizar Final" mostra o formulario como ficara embedado, sem controles de edicao.

---

## 1. Novo Layout da Tab Estilos

**Arquivo: `EditorTabsEstilos.tsx`** - Reescrever completamente

- Remover o layout split (config esquerda | preview direita)
- O preview ocupa 100% da area, centralizado
- Estado `selectedElement`: `'container' | 'campos' | 'botao' | 'cabecalho' | null`
- Estado `showFinalPreview`: boolean para alternar entre modo edicao e visualizacao final
- Barra de acoes no topo: botao "Visualizar Final" (icone Eye) + botao "Salvar Estilos" + toggle CSS Customizado

---

## 2. Preview Interativo com Click-to-Edit

**Novo componente: `EstiloPreviewInterativo.tsx`** (substitui o uso de `EstiloPreview`)

O preview renderiza o formulario com estilos aplicados em tempo real. Cada area clicavel tera:

- **Container (area externa):** Ao clicar no fundo/borda do container, abre popover com: cor de fundo, largura maxima, padding, borda arredondada, sombra, fonte
- **Campos (clicar em qualquer campo):** Abre popover com: cor do label, tamanho do label, fundo do input, borda do input, border-radius, cor do texto, cor do placeholder, cor de erro
- **Botao (clicar no botao Enviar):** Abre popover com: texto, cor do texto, cor de fundo, cor de hover, border-radius, largura, tamanho

Indicacao visual:
- Elemento selecionado recebe outline pontilhado azul (`outline-2 outline-dashed outline-primary`)
- Tooltip sutil ao hover: "Clique para editar"
- Ao clicar fora de qualquer elemento, fecha o popover

---

## 3. Popover de Edicao

**Novo componente: `EstiloPopover.tsx`**

- Usa Radix Popover posicionado ao lado do elemento clicado
- Conteudo: reutiliza os mesmos campos dos forms existentes (EstiloContainerForm, EstiloCamposForm, EstiloBotaoForm) mas em formato mais compacto
- Header do popover com titulo (ex: "Container", "Campos", "Botao") e botao fechar (X)
- Max-height com scroll interno para nao ultrapassar a tela

---

## 4. Modo Visualizacao Final

**Botao "Visualizar Final"** no topo da tab

- Ao clicar, alterna para modo somente-leitura que mostra o formulario exatamente como ficara embedado:
  - Sem outlines de selecao
  - Sem hover effects de edicao
  - Background da pagina aplicado (pagina.background_color)
  - Formulario centralizado simulando um website
- Botao muda para "Voltar ao Editor" para retornar ao modo de edicao
- Visual similar a terceira imagem enviada (formulario limpo, sem controles)

---

## 5. CSS Customizado

- Mover o campo de CSS Customizado para um botao/toggle no topo ("CSS Avancado")
- Ao clicar, abre um painel deslizante (drawer) na parte inferior com o textarea do CSS

---

## Detalhes Tecnicos

### Arquivos a criar:
1. `src/modules/formularios/components/estilos/EstiloPreviewInterativo.tsx` - Preview com areas clicaveis
2. `src/modules/formularios/components/estilos/EstiloPopover.tsx` - Popover generico para edicao

### Arquivos a editar:
1. `src/modules/formularios/components/editor/EditorTabsEstilos.tsx` - Novo layout com preview full + barra de acoes

### Arquivos mantidos (reutilizados dentro dos popovers):
- `EstiloContainerForm.tsx` - Campos do container
- `EstiloCamposForm.tsx` - Campos dos inputs
- `EstiloBotaoForm.tsx` - Campos do botao

### Dependencias:
- Radix Popover (`@radix-ui/react-popover`) - ja disponivel via shadcn
- Lucide icons: `Eye`, `EyeOff`, `Code`, `X`, `Save`

### Fluxo de interacao:
```text
+------------------------------------------+
|  [Eye] Visualizar Final  [Save] Salvar   |
+------------------------------------------+
|                                          |
|    +------------------------------+      |
|    | Container (clicavel)         |      |
|    |                              |      |
|    |   Titulo do Formulario       |      |
|    |                              |      |
|    |   [Label] ___input___        |      |
|    |   [Label] ___input___  <-- click    |
|    |   [Label] ___input___        |      |
|    |                              |      |
|    |   [ Enviar ]  <-- click abre |      |
|    |               popover botao  |      |
|    +------------------------------+      |
|                                          |
+------------------------------------------+
```

Ao clicar em um campo, um Popover aparece ao lado com as opcoes de estilo daquele tipo de elemento. Ao clicar no container (area de fundo), o popover mostra opcoes do container. Ao clicar no botao, mostra opcoes do botao.
