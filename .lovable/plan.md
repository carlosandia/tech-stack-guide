

# Plano: Ajustes no Canvas de Automacoes e Editor de Formularios Mobile

## 1. Reposicionar controles de zoom no canvas (Automacoes)

**Problema**: Os icones de zoom (+ / - / fullscreen) estao no canto inferior esquerdo, mas nao ha mais nada na direita. O usuario quer que fiquem na direita, na mesma linha do botao azul (FAB de menu).

**Solucao**: No `FlowCanvas.tsx`, alterar o posicionamento dos `Controls` do ReactFlow para ficarem no canto inferior direito (`!right-3 !bottom-20`) ao inves de esquerda, alinhados visualmente com o FAB azul que fica em `bottom-4 left-4`.

Arquivo: `src/modules/automacoes/components/FlowCanvas.tsx`
- Trocar `!bottom-20 !left-3` por `!bottom-20 !right-3` nas classes do `Controls`

---

## 2. Refatoracao do Editor de Formularios para Mobile

**Problema atual**: No mobile, o editor de formularios tem um layout de 3 paineis (paleta, preview, config) que nao funciona bem. A paleta ocupa a tela toda como overlay, o header tem tabs que ficam cortadas, e a experiencia e confusa.

**Proposta funcional para mobile**:

### 2.1 Header compacto no mobile
Arquivo: `src/modules/formularios/components/editor/EditorHeader.tsx`
- Ocultar badges (tipo/status) no mobile (ja esta feito com `hidden sm:inline`)
- Reduzir labels das tabs: mostrar apenas icones no mobile, texto + icone no desktop
- Usar `gap-0` e `px-2` mais compactos nas tabs mobile

### 2.2 Layout mobile com navegacao por abas inferiores (bottom tabs)
Arquivo: `src/modules/formularios/pages/FormularioEditorPage.tsx`

Em vez dos paineis laterais simultaneos, adotar o padrao **Progressive Disclosure** do design system:

- **Tab "Campos" no mobile**: Mostrar apenas o preview com um bottom bar fixo contendo 2 botoes: "Campos" (abre paleta em fullscreen overlay/sheet) e "Config" (abre config do campo selecionado em fullscreen overlay/sheet)
- **Remover os botoes toggle flutuantes** (PanelLeft/PanelRight) que sao confusos no mobile
- **Paleta como bottom sheet/overlay fullscreen**: Ao clicar em "Campos", a paleta abre como overlay de tela cheia (com scroll) sobre o preview, com botao de fechar no topo. Ao clicar em um campo da paleta, ele e adicionado e o overlay fecha automaticamente
- **Config como overlay fullscreen**: Quando o usuario toca em um campo no preview, a config abre como overlay fullscreen com o `CampoSidebarPanel` adaptado, e botao de fechar/voltar no topo
- **Preview ocupa 100% da tela** quando nenhum overlay esta aberto

### 2.3 Mudancas especificas por arquivo

**`EditorHeader.tsx`**:
- Tabs: mostrar so icones no mobile (`sm:inline` para o texto)
- Reduzir padding do header no mobile

**`FormularioEditorPage.tsx`**:
- Detectar mobile via classe CSS (`lg:hidden` / `lg:block`)
- Substituir paineis laterais por overlays fullscreen no mobile
- Adicionar bottom bar fixa com botoes "Campos" e "Configurar" (so aparece no mobile, quando tab ativa = campos)
- Quando `selectedCampoId` muda no mobile, abrir automaticamente o overlay de config
- Overlay de paleta: div absolute/fixed com `inset-0 z-30 bg-card` + scroll + botao fechar
- Overlay de config: mesmo padrao, aparece ao selecionar um campo

**`CampoSidebarPanel.tsx`**:
- No mobile, renderizar como fullscreen overlay em vez de sidebar lateral
- Adicionar classe condicional: `lg:w-72 lg:relative` vs `fixed inset-0 z-30` no mobile

### 2.4 Fluxo do usuario no mobile (resumo)

```text
[Header: <- Nome | Icones tabs | Publicar]
[Preview fullscreen do formulario]
[Bottom bar: [+ Campos] [Configurar campo]]

Toque em "+ Campos" -> Overlay fullscreen com paleta
  -> Toque em campo -> Adiciona e fecha overlay

Toque em campo no preview -> Seleciona campo
  -> Bottom bar muda para [Config] ativo
  -> Toque em "Configurar" -> Overlay fullscreen com config do campo
  -> Botao "Fechar" no topo volta ao preview
```

---

## Resumo de arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `FlowCanvas.tsx` | Mover Controls para direita (`!right-3`) |
| `EditorHeader.tsx` | Tabs so com icones no mobile |
| `FormularioEditorPage.tsx` | Layout mobile com bottom bar + overlays fullscreen |
| `CampoSidebarPanel.tsx` | Adaptar para fullscreen overlay no mobile |

