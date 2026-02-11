

# Botoes como Campos + Simplificacao das Abas

## Resumo

Transformar os botoes (Enviar e WhatsApp) em campos da paleta com categoria propria "Botao", mantendo-os sempre no rodape do formulario. Simplificar o painel lateral para apenas 2 abas (Estilo e Configuracao), movendo Pos-Envio para dentro de Configuracao.

## Mudancas

### 1. Paleta de Campos (`CamposPaleta.tsx`)

Adicionar nova categoria "Botao" com dois tipos:
- `botao_enviar` - "Botao Enviar" (icone: MousePointerClick ou similar)
- `botao_whatsapp` - "Botao WhatsApp" (icone: WhatsApp)

A categoria "Botao" aparece apos "Layout" na paleta.

**Validacao**: No `onAddCampo` e no drop, verificar se ja existe um campo do mesmo tipo nos campos atuais. Se ja existir, exibir `toast.error('Apenas um botao de enviar e permitido')` e bloquear a adicao.

### 2. BotaoConfigPanel - Remover aba "Pos-Envio"

- Remover a terceira aba "Pos-Envio"
- Mover todo o conteudo de pos-envio (mensagem sucesso, mensagem erro, acao apos envio, URL redirecionamento, tempo) para o final da aba "Configuracao", dentro de uma secao com titulo "Pos-Envio" e borda sutil
- Manter apenas 2 abas: **Estilo** | **Configuracao**

### 3. Renderizacao no Preview e Pagina Publica

**Logica de filtragem:**
- Na area de campos (editor e preview), filtrar campos do tipo `botao_enviar` e `botao_whatsapp` para NAO renderiza-los inline entre os campos
- No rodape (area `mt-6` apos os campos), renderizar os botoes encontrados na lista de campos

**Mapeamento de dados:**
- Quando um campo `botao_enviar` ou `botao_whatsapp` e selecionado no editor, abrir o `BotaoConfigPanel` no sidebar direito (ao inves do `CampoSidebarPanel`)
- Os estilos e config do botao continuam sendo salvos no `estiloBotao` e `config_botoes` existentes (nao muda o storage)

**Determinacao do `tipo_botao`:**
- O `configBotoes.tipo_botao` sera derivado automaticamente dos campos presentes:
  - Se ha `botao_enviar` e `botao_whatsapp`: `ambos`
  - Se ha so `botao_enviar`: `enviar`
  - Se ha so `botao_whatsapp`: `whatsapp`
  - Se nenhum: nao renderizar botoes

### 4. Selecao de campo-botao no editor

Quando o usuario clica na engrenagem de um campo `botao_enviar` ou `botao_whatsapp` no preview:
- O sidebar direito abre com `BotaoConfigPanel` ao inves de `CampoSidebarPanel`
- O tipo passado para o BotaoConfigPanel e determinado pelo tipo do campo selecionado

### 5. Validacao ao adicionar campo

Em `FormularioEditorPage.tsx`:
- No `handleDropNewCampo` e `handleAddCampoFromPaleta`, verificar se o tipo sendo adicionado e `botao_enviar` ou `botao_whatsapp`
- Se ja existir um campo desse tipo, bloquear com `toast.error`
- Na criacao inicial do formulario, adicionar automaticamente um campo `botao_enviar` com ordem 9999 (garante que fica no final)

## Arquivos alterados

| Arquivo | Alteracao |
|---|---|
| `CamposPaleta.tsx` | Adicionar categoria "Botao" com 2 tipos |
| `BotaoConfigPanel.tsx` | Remover aba Pos-Envio, mover conteudo para Configuracao |
| `FormPreview.tsx` | Filtrar campos de botao da area de campos, renderizar no rodape |
| `FormularioEditorPage.tsx` | Validacao de duplicidade, abrir BotaoConfigPanel para campos de botao |
| `FormularioPublicoPage.tsx` | Filtrar campos de botao e renderizar no rodape |
| `CampoItem.tsx` | Renderizar campos de botao com visual de botao (preview do botao) |

## Comportamento final

- Usuario arrasta "Botao Enviar" da paleta para o formulario - ele aparece sempre no rodape
- Se tentar adicionar segundo botao do mesmo tipo, recebe erro
- Ao clicar na engrenagem do botao, abre sidebar com 2 abas (Estilo + Configuracao com pos-envio embutido)
- Formularios existentes continuam funcionando (botoes atuais sao mantidos via `configBotoes`)

