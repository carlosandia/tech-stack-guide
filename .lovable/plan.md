

# Correção: Reações do WhatsApp não aparecem no CRM

## Problema

O webhook WAHA (`waha-webhook/index.ts`) ignora o evento `message.reaction` na linha 894. Quando alguém reage a uma mensagem no WhatsApp (ex: emoji 🙏), o WAHA envia um evento com `body.event === "message.reaction"`, mas o handler atual só processa `"message"` e `"message.any"`, descartando qualquer outro evento não tratado anteriormente.

Resultado: reações feitas no dispositivo WhatsApp nunca são salvas no banco, e portanto não aparecem na interface do CRM.

## Solução

Adicionar um handler para `message.reaction` no webhook, **antes** do filtro geral da linha 894. O handler deve:

1. Extrair o emoji e o `message_id` da mensagem reagida do payload WAHA
2. Encontrar a sessão e organização correspondente
3. Localizar a conversa associada à mensagem original
4. Inserir um registro na tabela `mensagens` com `tipo: 'reaction'`, seguindo o mesmo formato usado pelo frontend (campos `reaction_emoji` e `reaction_message_id`)

## Detalhes Técnicos

### Arquivo: `supabase/functions/waha-webhook/index.ts`

Inserir um novo bloco entre o handler de `label.chat.deleted` (linha ~891) e o filtro geral (linha 894):

```text
if (body.event === "message.reaction") {
  // 1. Extrair dados do payload WAHA
  //    - payload.reaction.text = emoji (ou "" para remover)
  //    - payload.reaction.messageId._serialized = ID da msg reagida
  //    - payload.from = chatId de quem reagiu
  //    - payload.fromMe = se a reação foi enviada por nós

  // 2. Buscar sessão pelo sessionName

  // 3. Se emoji vazio (""), significa remoção de reação:
  //    - Buscar e soft-deletar a mensagem de reação existente no banco

  // 4. Se emoji presente, inserir nova mensagem tipo 'reaction':
  //    - Buscar conversa pelo chatId (com resolução @lid)
  //    - Inserir na tabela mensagens com:
  //      tipo: 'reaction'
  //      reaction_emoji: emoji
  //      reaction_message_id: messageId serializado
  //      from_me: payload.fromMe
  //      message_id: gerado único para reações

  // 5. Retornar resposta de sucesso
}
```

**Campos do payload WAHA `message.reaction`** (formato GOWS):
- `payload.reaction.text` - o emoji (string vazia = remoção)
- `payload.reaction.messageId._serialized` ou `payload.reaction.messageId.id` - ID da mensagem reagida
- `payload.from` - chatId do remetente
- `payload.fromMe` - boolean

**Lógica de remoção**: quando `reaction.text === ""`, buscar no banco a mensagem de reação existente (`tipo = 'reaction'`, `reaction_message_id` = ID da msg original, mesmo `from_me`) e fazer soft delete (`deletado_em = now`).

**Lógica de inserção**: usar o mesmo padrão do frontend - `message_id: reaction_{timestamp}_{random}`, com resolução de `@lid` para encontrar a conversa correta.

### Nenhuma alteração no frontend

O frontend já sabe exibir reações recebidas via realtime (o hook `useConversasRealtime` escuta INSERTs em `mensagens` e o `ChatMessages` já agrega reações por `reaction_message_id`). Basta que o webhook insira corretamente no banco.

