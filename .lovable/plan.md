
## Correcao Completa: Contato, Lightbox, Documento, Enquete e Audio

---

### Resumo dos Problemas Identificados

| # | Problema | Causa Raiz |
|---|---------|------------|
| 1 | Contato enviado mostra "Convidar para o WhatsApp" | vCard sem parametro `waid` no telefone |
| 2 | Clicar na imagem nao abre visualizador | Nao existe componente de lightbox/viewer |
| 3 | Documento nao aparece no chat | Webhook nao extrai campos de midia (`media_url`, `media_filename`, etc.) das mensagens recebidas |
| 4 | Votos da enquete nao atualizam na UI | Webhook nao escuta evento `poll.vote` do WAHA |
| 5 | Audio gravado nao reproduz no WhatsApp | Formato WebM nao e compativel com `sendVoice` do WAHA (espera OGG/Opus) |

---

## Correcao 1: vCard com `waid` para contatos

**Arquivo:** `src/modules/conversas/components/ContatoSelectorModal.tsx`

O vCard atual gera `TEL;type=CELL:5511999...` sem o parametro `waid`. O WhatsApp precisa do `waid` para reconhecer que o numero tem conta WhatsApp.

**De:**
```
TEL;type=CELL:5511999999999
```

**Para:**
```
TEL;type=CELL;waid=5511999999999:+5511999999999
```

A funcao `gerarVCard` sera alterada para:
- Limpar o telefone (remover espacos, tracos, parenteses)
- Garantir que comece com `+` ou adicionar `+`
- Adicionar parametro `waid` com apenas digitos
- Formato final: `TEL;type=CELL;waid=DIGITOS:+DIGITOS`

---

## Correcao 2: Lightbox para Imagens e Videos

**Novo componente:** `src/modules/conversas/components/MediaViewer.tsx`

Modal fullscreen para visualizar imagens e videos com:
- Fundo escuro com backdrop blur
- Imagem/video centralizado em tamanho maximo
- Botao de fechar (X) no canto superior direito
- Botao de download no canto superior
- Zoom via scroll do mouse (imagens)
- Fechar ao clicar no backdrop ou pressionar Escape
- Z-index 500 (acima de todos os modais)

**Arquivo editado:** `src/modules/conversas/components/ChatMessageBubble.tsx`

- Adicionar estado `viewerOpen` e `viewerUrl` ao componente principal
- Nos componentes `ImageContent` e `VideoContent`, adicionar `onClick` que abre o `MediaViewer`
- O viewer sera renderizado via React Portal para evitar problemas de z-index

Porém, como `ImageContent` e `VideoContent` sao funcoes internas sem estado, a abordagem sera:
- Criar um contexto ou elevar o estado para o `ChatMessageBubble`
- Ou melhor: transformar o `MediaViewer` em um componente controlado que recebe `url`, `tipo` e `onClose` como props, e gerenciar o estado dentro de cada content component usando `useState`

---

## Correcao 3: Midia em Mensagens Recebidas (Documentos, Imagens, Audio)

**Arquivo:** `supabase/functions/waha-webhook/index.ts` (STEP 3 - Insert message)

O webhook atualmente insere a mensagem com apenas `has_media: payload.hasMedia`, mas **nao extrai os campos de midia**. Conforme documentacao do WAHA, quando `hasMedia: true`, o payload inclui:

```json
{
  "hasMedia": true,
  "media": {
    "url": "http://waha-server/api/files/...",
    "mimetype": "application/pdf",
    "filename": "documento.pdf",
    "error": null
  }
}
```

**Alteracoes no webhook (messageInsert):**

Adicionar extracao dos campos de midia do payload:

```text
// Extrair dados de midia
if (payload.hasMedia && payload.media?.url) {
  messageInsert.media_url = payload.media.url
  messageInsert.media_mimetype = payload.media.mimetype || null
  messageInsert.media_filename = payload.media.filename || payload._data?.filename || null
  messageInsert.media_size = payload.media.filesize || payload._data?.size || null
  messageInsert.media_duration = payload._data?.duration || null
}

// Extrair caption para mensagens de midia
if (payload.caption) {
  messageInsert.caption = payload.caption
}

// Extrair dados de localizacao
if (wahaType === 'location') {
  messageInsert.location_latitude = payload.location?.latitude || payload._data?.lat || null
  messageInsert.location_longitude = payload.location?.longitude || payload._data?.lng || null
  messageInsert.location_name = payload.location?.description || null
  messageInsert.location_address = payload.location?.address || null
}

// Extrair dados de contato (vCard)
if (wahaType === 'contact' || wahaType === 'vcard') {
  messageInsert.tipo = 'contact'
  messageInsert.vcard = payload.vCards?.[0] || payload._data?.body || null
}

// Extrair dados de enquete
if (wahaType === 'poll' || wahaType === 'poll_creation') {
  messageInsert.tipo = 'poll'
  messageInsert.poll_question = payload._data?.pollName || payload.body || null
  messageInsert.poll_options = payload._data?.pollOptions?.map(opt => ({ text: opt.name, votes: 0 })) || null
}
```

Isso fara com que documentos, imagens, audio e video recebidos tenham a URL de midia salva, permitindo exibi-los corretamente no chat.

**Observacao importante:** A `media_url` do WAHA aponta para o servidor WAHA (ex: `http://waha-server:3000/api/files/...`). O frontend precisara acessar essa URL. Como o WAHA esta em um servidor externo, a URL deve ser acessivel publicamente ou via proxy. Para seguranca, o ideal seria:
- Re-upload do arquivo para o bucket `chat-media` do Supabase Storage dentro do webhook
- OU manter a URL direta do WAHA se o servidor for acessivel

Para simplificar nesta fase, vamos manter a URL do WAHA diretamente (que ja e acessivel se o servidor WAHA tiver endpoint publico). Se necessario, depois implementamos re-upload.

---

## Correcao 4: Votos da Enquete em Tempo Real

### 4.1 - Subscrever ao evento `poll.vote`

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Alterar a lista de eventos do webhook:

```text
const webhookEvents = ["message", "message.ack", "poll.vote"];
```

Isso precisa ser atualizado em todas as ocorrencias (linhas 120, 176, 225, 454).

### 4.2 - Processar `poll.vote` no webhook

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

Adicionar handler para `poll.vote` apos o handler de `message.ack`:

```text
if (body.event === "poll.vote") {
  const payload = body.payload;
  const vote = payload?.vote;
  
  if (vote) {
    // O vote contem o id da mensagem da enquete e as opcoes selecionadas
    const pollMessageId = vote.id || vote.parentMessage?.id?._serialized || null;
    const selectedOptions = vote.selectedOptions || [];
    
    if (pollMessageId) {
      // Buscar a mensagem da enquete
      const { data: pollMsg } = await supabaseAdmin
        .from("mensagens")
        .select("id, poll_options")
        .eq("message_id", pollMessageId)
        .maybeSingle();
      
      if (pollMsg && pollMsg.poll_options) {
        // Atualizar contagem de votos
        const updatedOptions = pollMsg.poll_options.map(opt => {
          const wasSelected = selectedOptions.some(so => so.name === opt.text);
          return { ...opt, votes: wasSelected ? opt.votes + 1 : opt.votes };
        });
        
        await supabaseAdmin
          .from("mensagens")
          .update({ poll_options: updatedOptions, atualizado_em: new Date().toISOString() })
          .eq("id", pollMsg.id);
      }
    }
  }
  
  return Response ok
}
```

O listener de UPDATE em mensagens (ja implementado no passo anterior) vai captar essa alteracao e invalidar o cache, atualizando a UI automaticamente.

---

## Correcao 5: Audio em Formato Compativel

### 5.1 - Gravar em formato OGG quando possivel

**Arquivo:** `src/modules/conversas/components/AudioRecorder.tsx`

O `MediaRecorder` do navegador suporta diferentes formatos. A ordem de preferencia sera:
1. `audio/ogg;codecs=opus` (compativel nativamente com WhatsApp)
2. `audio/webm;codecs=opus` (fallback se OGG nao disponivel)

Se o formato final for WebM, o upload sera feito com extensao `.ogg` e content-type `audio/ogg` para que o WAHA interprete corretamente.

**De:**
```typescript
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/webm'
```

**Para:**
```typescript
const mimeType = MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
  ? 'audio/ogg;codecs=opus'
  : MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm'
```

### 5.2 - Upload com extensao e mimetype corretos

**Arquivo:** `src/modules/conversas/components/ChatWindow.tsx` (handleAudioSend)

Alterar o upload para usar extensao `.ogg` e content-type `audio/ogg`:

```text
const path = `conversas/${conversa.id}/audio_${Date.now()}.ogg`
// ...
upload(path, blob, { contentType: 'audio/ogg' })
```

Isso faz com que o WAHA receba uma URL `.ogg`, que e o formato esperado pelo `sendVoice`.

---

## Resumo de Arquivos

### Arquivos novos:
- `src/modules/conversas/components/MediaViewer.tsx`

### Arquivos editados:
1. `src/modules/conversas/components/ContatoSelectorModal.tsx` (vCard com `waid`)
2. `src/modules/conversas/components/ChatMessageBubble.tsx` (integrar MediaViewer para imagens/videos)
3. `supabase/functions/waha-webhook/index.ts` (extrair midia + handler `poll.vote`)
4. `supabase/functions/waha-proxy/index.ts` (adicionar `poll.vote` aos eventos webhook)
5. `src/modules/conversas/components/AudioRecorder.tsx` (formato OGG prioritario)
6. `src/modules/conversas/components/ChatWindow.tsx` (upload audio com extensao .ogg)

### Deploy necessario:
- `waha-proxy` (novos eventos webhook)
- `waha-webhook` (media extraction + poll.vote handler)

### Sequencia de implementacao:
1. Edge Functions (webhook + proxy)
2. Componente MediaViewer
3. Correcao do vCard
4. Correcao do AudioRecorder + ChatWindow
5. Integracao do MediaViewer no ChatMessageBubble
6. Deploy das edge functions
