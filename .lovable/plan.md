

## Correcao: Envio de imagem via WAHA GOWS nao chega no WhatsApp

### Problema Identificado

O WAHA GOWS retorna HTTP 201 (sucesso) mas a imagem nao chega no WhatsApp porque o campo `file.mimetype` e `file.filename` estao ausentes na requisicao `sendImage`. O WAHA precisa dessas informacoes para processar a midia corretamente.

Payload atual (incorreto):
```text
mediaBody.file = { url: "https://...jpeg" }
```

Payload correto (conforme documentacao WAHA):
```text
mediaBody.file = { url: "https://...jpeg", mimetype: "image/jpeg", filename: "image.jpeg" }
```

### Plano de Correcao

**Arquivo: `supabase/functions/waha-proxy/index.ts`**

No bloco `enviar_media`, ao montar o `mediaBody` para `sendImage` e `sendVideo`, adicionar deteccao automatica de `mimetype` e `filename` a partir da URL:

1. Criar funcao helper `detectMimeFromUrl(url, mediaType)` que:
   - Extrai a extensao do arquivo da URL (ex: `.jpeg`, `.png`, `.webm`)
   - Mapeia para o mimetype correto (ex: `image/jpeg`, `image/png`)
   - Se nao conseguir detectar, usa fallback baseado no `media_type` informado (`image/jpeg` para imagens, `video/mp4` para videos)

2. Alterar a montagem do `mediaBody.file` para incluir `mimetype` e `filename`:
   - Para `sendImage`: `{ url, mimetype: "image/jpeg", filename: "image.jpeg" }`
   - Para `sendVideo`: `{ url, mimetype: "video/mp4", filename: "video.mp4" }`
   - Para `sendFile`: ja funciona pois aceita `mimetype` e `filename` do request

3. Manter `sendVoice` como esta (ja funciona com `convert: true`)

### Secao Tecnica

Mudanca concentrada em um unico arquivo:

```text
supabase/functions/waha-proxy/index.ts
  - Linhas ~653-673: bloco onde monta mediaBody
  - Adicionar helper para detectar mimetype da URL
  - Incluir mimetype + filename no objeto file para sendImage/sendVideo
```

Exemplo do payload final para sendImage:
```text
{
  "session": "crm_xxx",
  "chatId": "551399@c.us",
  "file": {
    "url": "https://xxx.supabase.co/.../image.jpeg",
    "mimetype": "image/jpeg",
    "filename": "image.jpeg"
  },
  "caption": "texto opcional"
}
```

