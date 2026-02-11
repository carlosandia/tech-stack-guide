
# Remover Botoes da Paleta + Ajustar BotaoConfigPanel

## Resumo

Reverter a logica de botoes-como-campos. Botoes voltam a ser controlados exclusivamente pelo `BotaoConfigPanel` via `tipo_botao`. Remover categoria "Botao" da paleta, remover icone de lixeira dos botoes no preview, inverter ordem das abas, e mostrar estilos condicionalmente ao tipo selecionado.

## Mudancas

### 1. CamposPaleta.tsx
- Remover os dois itens `botao_enviar` e `botao_whatsapp` do array `TIPOS_CAMPO`
- Remover a categoria `'botao'` de `CATEGORIAS`
- Remover prop `botoesAdicionados` e toda logica de disabled/singleton
- Remover imports nao utilizados (`MousePointerClick`, `WhatsAppIcon`)

### 2. BotaoConfigPanel.tsx
- **Inverter abas**: "Configuracao" na esquerda, "Estilo" na direita
- **Tab Estilo**: Mostrar estilos conforme `config.tipo_botao`:
  - `enviar` → apenas `renderEstiloEnviar()`
  - `whatsapp` → apenas `renderEstiloWhatsApp()`
  - `ambos` → ambos os renders (Enviar + separador + WhatsApp)
- Tab default muda para `'config'` ao inves de `'estilo'`

### 3. FormPreview.tsx (RenderBotoes)
- Remover prop `onRemoveBotao` e todo o codigo do botao `Trash2` nos botoes enviar e whatsapp
- Manter apenas o icone de engrenagem (Settings)

### 4. FormularioEditorPage.tsx
- Remover `derivedTipoBotao` (nao mais derivado dos campos)
- `effectiveConfigBotoes` usa `configBotoes` direto, sem override de `tipo_botao`
- Remover `botoesAdicionados` prop do `CamposPaleta`
- Remover validacao de duplicidade de botoes em `handleDropNewCampo` e `handleAddCampoFromPaleta`
- Remover `isSelectedCampoBotao` e o bloco condicional que abre `BotaoConfigPanel` para campos de botao
- O BotaoConfigPanel so abre via `selectedStyleElement === 'botao'` ou `'botao_whatsapp'` (clicando no botao no preview)

### 5. FormularioPublicoPage.tsx
- Remover filtragem de campos `botao_enviar`/`botao_whatsapp` (eles nao existirao mais como campos)
- Voltar a usar `configBotoes.tipo_botao` direto do formulario

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `CamposPaleta.tsx` | Remover categoria Botao e props associadas |
| `BotaoConfigPanel.tsx` | Inverter abas, estilos condicionais por tipo_botao |
| `FormPreview.tsx` | Remover Trash2 dos botoes |
| `FormularioEditorPage.tsx` | Remover logica de botoes-como-campos |
| `FormularioPublicoPage.tsx` | Simplificar filtragem de campos |
