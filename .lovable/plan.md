
# Plano: 5 Correcoes no Editor de Formularios

## 1. Config nao atualiza campos visiveis apos salvar tipo de botao

**Problema**: Ao trocar o tipo de botao (ex: para "Ambos") e salvar, os campos de configuracao especificos nao aparecem imediatamente. So aparecem ao fechar e reabrir o painel.

**Causa**: O `BotaoConfigPanel` carrega `config` do banco apenas no `useEffect` inicial. Apos o `saveConfig`, o `queryClient.invalidateQueries` invalida a query mas o estado local `config` ja foi atualizado via `setConfig`. O problema real e que o `configBotoes` no `FormularioEditorPage` (que controla quais botoes aparecem no preview) nao recarrega - o `formulario` precisa ser re-fetched.

**Correcao**:
- No `BotaoConfigPanel.tsx`, apos salvar com sucesso, tambem invalidar a query `['formularios', formularioId]` (ja faz isso) E propagar o novo `config` para o pai via callback.
- Adicionar uma prop `onConfigChange` ao `BotaoConfigPanel` para notificar o `FormularioEditorPage` da mudanca imediata no `configBotoes`.
- No `FormularioEditorPage`, manter um estado local `configBotoes` que e atualizado tanto pelo fetch quanto pelo callback do painel.

---

## 2. Largura Total nao funciona com dois botoes

**Problema**: Quando "Largura Total" esta selecionada e ha dois botoes, o botao Enviar fica muito pequeno (nao ocupa 50% cada).

**Causa**: No `renderBotoes` (FormPreview.tsx linha 487-493), quando `tipoBotao === 'ambos'`, os botoes ficam em `flex` mas sem `flex-1`. O `buttonStyle.width` e `100%` (largura total), mas dentro de um flex container sem grow, isso nao se distribui bem.

**Correcao**:
- Quando `tipoBotao === 'ambos'`, aplicar `flex-1` nos wrappers dos botoes para que dividam o espaco igualmente.
- Quando o estilo for "Largura Total" e houver 2 botoes, cada um recebe `flex: 1` e `width: 100%` dentro do seu wrapper.
- Quando for "auto" ou "50%", manter o comportamento atual.

---

## 3. Visualizar Final deve permitir interacao/teste

**Problema**: No modo "Visualizar Final", os campos estao todos com `readOnly` ou `disabled`, impossibilitando testar o formulario.

**Correcao**:
- No `renderFinalCampo` (FormPreview.tsx linhas 500-711), remover `readOnly` e `disabled` de todos os inputs.
- Permitir que checkboxes, selects, radios, date pickers etc. sejam interativos.
- Manter os botoes funcionais no preview final (sem `onClick={undefined}`).

---

## 4. Campo "Termos de Uso" precisa de link para modal

**Problema**: O campo `checkbox_termos` renderiza apenas um checkbox com texto, sem possibilidade de visualizar os termos.

**Correcao**:
- Adicionar um campo `conteudo_termos` ao `CampoFormulario` (usar o campo `valor_padrao` ja existente para armazenar o HTML dos termos).
- No `CampoConfigPanel`, quando o tipo for `checkbox_termos`, mostrar um campo `Textarea` para inserir o texto dos termos.
- No `renderFinalCampo` e no `CampoItem`, renderizar um link "Ver termos" ao lado do checkbox que abre um Dialog/Modal com o conteudo.
- Criar um componente `TermosModal` simples com Dialog do Radix.

---

## 5. Texto de ajuda deve aparecer como icone (i) ao lado do label

**Problema**: O texto de ajuda aparece como texto simples abaixo do campo. Deveria ser um icone (i) ao lado do label que mostra o texto em tooltip/popover.

**Correcao**:
- No `CampoItem.tsx` (linha 98-100), substituir o `<p>` do texto de ajuda por um icone `Info` (lucide) ao lado do label (linha 89-95).
- Usar um `Popover` ou `title` attr para mostrar o texto ao passar o mouse.
- No `renderFinalCampo` (FormPreview.tsx), aplicar o mesmo padrao: icone (i) ao lado do label com tooltip.

---

## Arquivos a modificar

1. **`BotaoConfigPanel.tsx`** - Adicionar prop `onConfigChange` callback; chamar apos salvar
2. **`FormularioEditorPage.tsx`** - Estado local para `configBotoes` atualizado via callback
3. **`FormPreview.tsx`**:
   - `renderBotoes`: flex-1 nos wrappers quando ambos
   - `renderFinalCampo`: remover readOnly/disabled; adicionar icone (i) para texto_ajuda; modal de termos no checkbox_termos
4. **`CampoItem.tsx`** - Texto de ajuda como icone (i) com Popover ao lado do label
5. **`CampoConfigPanel.tsx`** - Campo para conteudo dos termos quando tipo = checkbox_termos (usar `valor_padrao`)

## Componente novo

- `src/modules/formularios/components/campos/TermosModal.tsx` - Dialog simples para exibir texto dos termos
