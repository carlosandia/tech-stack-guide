
# Plano: Botoes individualizados e configuracao acessivel na aba Campos

## Problema 1: Pincel de estilo unico para dois botoes

Atualmente, ha um unico icone de pincel que abre o painel de estilo "botao" para ambos os botoes (Enviar e WhatsApp). O usuario precisa poder estilizar cada botao individualmente.

### Solucao

1. **Expandir o tipo `SelectedElement`** em `EstiloPreviewInterativo.tsx` para incluir `'botao_whatsapp'` alem de `'botao'`
2. **Renderizar dois pinceis separados** no `FormPreview.tsx` (linhas 388-416):
   - Um pincel sobre o botao "Enviar" que abre `selectedStyleElement = 'botao'`
   - Um pincel sobre o botao "WhatsApp" que abre `selectedStyleElement = 'botao_whatsapp'`
   - Cada botao tera seu proprio `group/` wrapper com pincel individual
3. **Adicionar painel de estilo do WhatsApp** no `FormularioEditorPage.tsx` (linhas 335-351):
   - Quando `selectedStyleElement === 'botao_whatsapp'`, renderizar um novo formulario `EstiloBotaoWhatsAppForm` dentro do `EstiloPopover`
   - Este formulario permitira configurar: texto do botao, cor de fundo, cor do texto, border-radius (campos ja parcialmente definidos na interface `EstiloBotaoWhatsApp` em `EstiloBotaoForm.tsx`)
4. **Salvar estilos do WhatsApp** no objeto `botao` existente, adicionando campos prefixados (`whatsapp_texto`, `whatsapp_background`, `whatsapp_texto_cor`) ao tipo `EstiloBotao` em `formularios.api.ts`
5. **Aplicar estilos individuais** na funcao `renderBotoes` do `FormPreview.tsx` - o botao WhatsApp usara as cores configuradas em vez do verde fixo `#25D366`

---

## Problema 2: Configuracao de botoes escondida na aba Configuracoes

O usuario configura campos e ve botoes na aba "Campos", mas a configuracao dos botoes (tipo, WhatsApp, etc.) esta na aba "Configuracoes". Isso dificulta a descoberta.

### Solucao

Mover a configuracao dos botoes para um **painel compacto abaixo dos botoes no preview**, acessivel via click no pincel ou um icone de engrenagem no proprio botao. Quando o usuario clica no pincel de estilo do botao, o painel lateral ja abre. Adicionaremos uma **aba/toggle dentro do EstiloPopover** para alternar entre "Estilo" e "Comportamento".

Implementacao:

1. **Criar componente `BotaoConfigPanel.tsx`** que combina:
   - Toggle de tipo de botao (Enviar / WhatsApp / Ambos) - versao compacta
   - Configuracoes do WhatsApp (numero, template) - quando WhatsApp ativo
   - Configuracoes de oportunidade e email - toggles compactos
   - Reutiliza a logica do `ConfigBotoesEnvioForm` mas em formato compacto para o painel lateral

2. **Atualizar o `EstiloPopover`** para quando `selectedStyleElement === 'botao'`:
   - Mostrar duas sub-abas: "Estilo" (formulario atual de cores/tamanho) e "Configuracao" (tipo de botao, WhatsApp, etc.)
   - Isso mantem tudo acessivel na aba Campos sem sair do contexto

3. **Remover `ConfigBotoesEnvioForm` do `EditorTabsConfig.tsx`** - ja que estara acessivel pelo painel do botao na aba Campos. Manter `ConfigPosEnvioForm` na aba Configuracoes pois e sobre comportamento pos-envio.

4. **Atualizar `FormularioEditorPage.tsx`** para:
   - Recarregar `configBotoes` apos salvar no painel (invalidar query do formulario)
   - Passar callback de atualizacao para o painel

---

## Detalhes Tecnicos

### Arquivos a criar:
- `src/modules/formularios/components/config/BotaoConfigPanel.tsx` - Painel compacto com abas Estilo/Configuracao para o botao

### Arquivos a modificar:

1. **`EstiloPreviewInterativo.tsx`** - Expandir tipo `SelectedElement` para `'botao' | 'botao_whatsapp'`

2. **`FormPreview.tsx`**:
   - Separar pinceis por botao (Enviar e WhatsApp) com wrappers individuais `group/`
   - Aplicar estilos do WhatsApp do objeto `estiloBotao` (campos whatsapp_*)

3. **`FormularioEditorPage.tsx`**:
   - Adicionar tratamento para `selectedStyleElement === 'botao_whatsapp'`
   - Renderizar `BotaoConfigPanel` no `EstiloPopover` com sub-abas
   - Invalidar query do formulario ao salvar config de botoes

4. **`formularios.api.ts`** - Adicionar campos `whatsapp_texto`, `whatsapp_background`, `whatsapp_texto_cor` ao tipo `EstiloBotao`

5. **`EstiloBotaoForm.tsx`** - Manter apenas estilos do botao Enviar (como esta)

6. **`EditorTabsConfig.tsx`** - Remover `ConfigBotoesEnvioForm` desta secao (movido para painel do botao)

### Fluxo do usuario (resultado final):

```text
Aba Campos > Preview > Clica no pincel do botao Enviar
  > Painel lateral abre com:
    [Estilo] [Configuracao]
    - Estilo: cores, tamanho, texto
    - Configuracao: tipo botao, oportunidade, email

Aba Campos > Preview > Clica no pincel do botao WhatsApp
  > Painel lateral abre com:
    [Estilo] [Configuracao]  
    - Estilo: cor de fundo, texto, border-radius
    - Configuracao: numero, template, oportunidade, email
```
