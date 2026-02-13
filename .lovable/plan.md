
# Correcao: Audio nao chega ao destinatario WhatsApp

## Diagnostico

Analisei os logs do WAHA e os dados no banco. Descobri o seguinte padrao:

- **Audios que FUNCIONARAM (ack=3 READ):** foram enviados **sem** o campo `mimetype` no payload do `sendVoice`
- **Audios que NAO CHEGARAM (ack=1 PENDING):** foram enviados **com** `mimetype: "audio/webm; codecs=opus"`

O navegador Chrome nao suporta gravacao em `audio/ogg`, entao o MediaRecorder grava em `audio/webm;codecs=opus`. Quando esse mimetype e passado ao WAHA GOWS no endpoint `sendVoice`, o servidor provavelmente pula a conversao de formato (achando que ja esta correto), mas o WhatsApp nao aceita webm -- ele exige OGG/Opus para mensagens de voz.

## Solucao

Remover o envio do `mimetype` no payload do `sendVoice` dentro da Edge Function `waha-proxy`. Isso faz o WAHA auto-detectar o formato e converter automaticamente para OGG/Opus antes de enviar ao WhatsApp.

## Alteracao

### Arquivo: `supabase/functions/waha-proxy/index.ts`

No trecho do `sendVoice` (linhas 656-660), remover a inclusao condicional do mimetype:

**Antes:**
```typescript
} else if (endpoint === "sendVoice") {
  const fileObj: Record<string, unknown> = { url: media_url };
  if (mimetype) fileObj.mimetype = mimetype;
  mediaBody.file = fileObj;
}
```

**Depois:**
```typescript
} else if (endpoint === "sendVoice") {
  // AIDEV-NOTE: NAO passar mimetype para sendVoice - WAHA GOWS precisa
  // auto-detectar o formato e converter para OGG/Opus automaticamente.
  // Passar mimetype webm faz o WAHA pular a conversao e o WhatsApp rejeita.
  mediaBody.file = { url: media_url };
}
```

Essa e a unica alteracao necessaria. O deploy da edge function sera feito em seguida para validacao.
