
# Correcao: Respostas em Grupos + Avatar de Audio

## Problemas Identificados

### 1. Respostas (reply/quote) nao detectadas em grupos GOWS

O webhook nao salva `reply_to_message_id` para mensagens GOWS porque:

- O codigo verifica `sub.contextInfo?.stanzaId` (d minusculo), mas o GOWS envia `stanzaID` (D maiusculo)
- O codigo busca em `payload._data?.message` (m minusculo), mas o GOWS envia `payload._data?.Message` (M maiusculo)
- O payload tambem tem `payload.replyTo.id` como fallback, que nunca e verificado

Exemplo do raw_data real:
```text
_data.Message.extendedTextMessage.contextInfo.stanzaID = "3A9933702605A7147E54"
(webhook procura: _data.message.*.contextInfo.stanzaId -- nao encontra)
```

### 2. Audio mostrando foto do contato em vez do usuario

O `ChatWindow` passa `fotoUrl={conversa.contato?.foto_url}` para `ChatMessages`, que repassa para `AudioContent` e `WhatsAppAudioPlayer`. Para mensagens `fromMe`, deveria mostrar o avatar do usuario logado, nao o do contato.

### 3. QuotedMessagePreview mostra "Contato" generico

Em grupos, o preview da mensagem citada exibe "Voce" ou "Contato", quando deveria exibir o nome do participante que enviou a mensagem original.

---

## Solucao

### Mudanca 1: Webhook - Corrigir extracao do stanzaID (PascalCase)

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Alterar a busca do quotedStanzaID para verificar ambas as variantes:

```typescript
// Buscar em _data.message E _data.Message (GOWS usa PascalCase)
const msgData = payload._data?.message || payload._data?.Message;
if (msgData && typeof msgData === 'object') {
  for (const key of Object.keys(msgData)) {
    const sub = msgData[key];
    if (sub && typeof sub === 'object') {
      const stanza = sub.contextInfo?.stanzaId || sub.contextInfo?.stanzaID;
      if (stanza) {
        quotedStanzaID = stanza;
        break;
      }
    }
  }
}

// Fallback: replyTo.id (presente em payloads GOWS)
if (!quotedStanzaID && payload.replyTo?.id) {
  quotedStanzaID = payload.replyTo.id;
}
```

### Mudanca 2: Audio - Usar avatar do usuario logado para fromMe

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

Alterar `AudioContent` para receber o avatar do usuario logado e usa-lo quando `isMe`:

```typescript
function AudioContent({ mensagem, isMe, fotoUrl, myAvatarUrl }: { 
  mensagem: Mensagem; isMe?: boolean; fotoUrl?: string | null; myAvatarUrl?: string | null 
}) {
  // Para mensagens proprias, usar avatar do usuario logado
  const avatarUrl = isMe ? myAvatarUrl : fotoUrl;
  return <WhatsAppAudioPlayer src={mensagem.media_url} isMe={!!isMe} fotoUrl={avatarUrl} />
}
```

**Arquivo**: `src/modules/conversas/components/ChatWindow.tsx`

Passar `myAvatarUrl` (do `useAuth`) para `ChatMessages` e propagar ate `AudioContent`.

### Mudanca 3: QuotedMessagePreview - Exibir nome do participante

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

Alterar `QuotedMessagePreview` para usar o `participantName` ou `pushName` do raw_data da mensagem citada:

```typescript
function QuotedMessagePreview({ quoted, isMe, contactMap }: { 
  quoted: Mensagem; isMe: boolean; contactMap?: Map<string, string> 
}) {
  const senderName = useMemo(() => {
    if (quoted.from_me) return 'Voce'
    // Tentar pushName do participante
    const rawData = quoted.raw_data as Record<string, unknown> | null
    const _data = rawData?._data as Record<string, unknown> | undefined
    const pushName = _data?.pushName || _data?.PushName || _data?.Info?.PushName
    if (pushName) return pushName as string
    return 'Contato'
  }, [quoted])

  return (
    <p className="text-[11px] font-semibold text-primary truncate">
      {senderName}
    </p>
    // ...
  )
}
```

---

## Arquivos a modificar

1. `supabase/functions/waha-webhook/index.ts` - Corrigir extracao stanzaID (PascalCase + fallback replyTo)
2. `src/modules/conversas/components/ChatMessageBubble.tsx` - AudioContent com avatar correto + QuotedMessagePreview com nome do participante
3. `src/modules/conversas/components/ChatWindow.tsx` - Passar avatar do usuario logado
4. `src/modules/conversas/components/ChatMessages.tsx` - Propagar myAvatarUrl

## Resultado Esperado

- Mensagens de resposta em grupos GOWS serao salvas com `reply_to_message_id` e exibidas com quote visual
- Audio enviado pelo usuario mostrara seu proprio avatar
- Quote exibira o nome do participante original (via pushName) em vez de "Contato" generico
