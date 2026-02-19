

## Correcao: Exibir preview de resposta a Status do WhatsApp no CRM

### Problema
Quando voce responde a um **Status (story)** do WhatsApp, o CRM nao mostra o card de referencia (nome do contato + preview da imagem/texto do status). No WhatsApp aparece "Danilo Boa Ideia - Status - Bora fazer acontecer!" com a thumbnail, mas no CRM so aparece a mensagem de texto sem contexto.

### Causa Raiz
O sistema atual busca a mensagem citada (`reply_to_message_id`) apenas na lista de mensagens carregadas da conversa. Porem, mensagens de **Status/Story** nunca sao salvas como mensagens de chat -- elas existem apenas no `raw_data` da mensagem que faz a resposta, dentro de `contextInfo.quotedMessage`. Como nao encontra, retorna `null` e nao renderiza nenhum preview.

### Solucao
Implementar um **fallback** que extrai o conteudo citado diretamente do `raw_data` quando a mensagem original nao e encontrada na lista. Isso cobre:
- Respostas a Status/Stories
- Respostas a mensagens muito antigas que nao estao carregadas na pagina atual

### Alteracoes Tecnicas

**1. `ChatMessages.tsx` - Extrair quote do raw_data como fallback**
- Quando `messageByWahaId.get(reply_to_message_id)` retorna `null`, verificar o `raw_data` da propria mensagem para extrair `contextInfo.quotedMessage`
- Construir um objeto `Mensagem` sintetico a partir dos dados encontrados (tipo, body, caption, midia, etc.)
- Detectar se e resposta a Status via `remoteJID === "status@broadcast"`

**2. `ChatMessageBubble.tsx` - Atualizar `QuotedMessagePreview`**
- Aceitar uma prop opcional `isStatusReply` para exibir o badge "Status" (similar ao WhatsApp)
- Renderizar thumbnail da imagem quando disponivel no `quotedMessage` (campo `media_url` ou thumbnail em base64)
- Exibir o nome do participante + indicador visual de Status

### Detalhes da Extracao do raw_data
O `raw_data` da mensagem de resposta contem a seguinte estrutura:

```text
raw_data._data.Message.extendedTextMessage.contextInfo:
  - stanzaID: "2AE8A850D9C2AE78F128"
  - remoteJID: "status@broadcast"        <-- indica resposta a Status
  - participant: "5513974079532@s.whatsapp.net"
  - quotedMessage:
      - imageMessage:
          - caption: "Bora fazer acontecer!"
          - mimetype: "image/jpeg"
          - JPEGThumbnail: (base64)       <-- thumbnail para preview
```

A partir disso, o fallback ira:
1. Detectar o tipo da mensagem citada (imageMessage, videoMessage, extendedTextMessage, etc.)
2. Extrair body/caption e thumbnail
3. Marcar como resposta a Status quando `remoteJID === "status@broadcast"`
4. Exibir o nome do remetente do status via `participant` ou `pushName`

### Resultado Visual Esperado
O card de quote renderizado no CRM tera:
- Borda colorida a esquerda (padrao ja existente)
- Nome do contato + badge "Status" quando aplicavel
- Texto/caption da mensagem original
- Thumbnail da imagem (quando disponivel)

