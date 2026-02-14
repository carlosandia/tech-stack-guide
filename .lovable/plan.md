
# Apagar Conversa e Mensagens com Sincronizacao no WhatsApp

## Situacao Atual

Analisando o codigo, encontrei o seguinte:

| Acao | CRM (local) | WhatsApp (dispositivo) |
|------|------------|----------------------|
| Apagar conversa | Soft delete | Ja chama WAHA API (DELETE /chats/{chatId}) |
| Apagar mensagem para mim | Soft delete local | NAO chama WAHA - so apaga no CRM |
| Apagar mensagem para todos | Soft delete local | Ja chama WAHA API (DELETE /messages/{id}) |

## Problema

"Apagar para mim" faz apenas soft delete no banco de dados do CRM, mas nao comunica ao WhatsApp. A mensagem continua visivel no dispositivo do celular.

## O que sera feito

### 1. Apagar mensagem "para mim" tambem no dispositivo

**Arquivo:** `src/modules/conversas/services/conversas.api.ts`

Atualmente o codigo so chama WAHA quando `paraTodos === true`. Sera alterado para SEMPRE chamar WAHA, passando um parametro que diferencia "para mim" vs "para todos".

```
// ANTES: so chama WAHA se paraTodos
if (paraTodos) { ... chamar WAHA ... }

// DEPOIS: sempre chama WAHA, com parametro
chamar WAHA com { para_todos: paraTodos }
```

### 2. Nova action no waha-proxy para "apagar para mim"

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

A action `apagar_mensagem` atual sempre deleta "para todos". Sera adicionado um parametro `para_todos` que controla o comportamento:

- `para_todos = true`: usa `DELETE /api/{session}/chats/{chatId}/messages/{messageId}` (apaga para todos, comportamento atual)
- `para_todos = false`: usa `PUT /api/{session}/chats/{chatId}/messages` com body `{ "messages": [messageId], "deleteMedia": true }` para deletar somente localmente no dispositivo

### 3. Apagar conversa (ja funciona)

O codigo em `conversas.api.ts` (linha 557-578) ja chama a action `apagar_conversa` no waha-proxy, que por sua vez chama `DELETE /api/{session}/chats/{chatId}`. Isso ja funciona corretamente - a conversa e removida tanto do CRM quanto do dispositivo.

---

## Detalhes Tecnicos

### Mudanca 1 - conversas.api.ts (apagarMensagem)

Remover a condicional `if (paraTodos)` e sempre enviar para WAHA, passando o parametro:

```typescript
async apagarMensagem(conversaId, mensagemId, messageWahaId, paraTodos) {
  const session = await getConversaWahaSession(conversaId)
  if (session) {
    try {
      await supabase.functions.invoke('waha-proxy', {
        body: {
          action: 'apagar_mensagem',
          session_name: session.sessionName,
          chat_id: session.chatId,
          message_id: messageWahaId,
          para_todos: paraTodos,
        },
      })
    } catch (e) {
      console.warn('[conversasApi] WAHA apagar_mensagem falhou:', e)
    }
  }
  // Soft delete local (sempre)
  await supabase.from('mensagens').update({ deletado_em: ... }).eq('id', mensagemId)
}
```

### Mudanca 2 - waha-proxy/index.ts (action apagar_mensagem)

Receber `para_todos` e rotear para o endpoint correto:

```typescript
case "apagar_mensagem": {
  const { chat_id, message_id, para_todos } = body;

  if (para_todos) {
    // DELETE para todos (endpoint existente)
    await fetch(`${baseUrl}/api/${session}/chats/${chatId}/messages/${messageId}`, {
      method: "DELETE",
      headers: { "X-Api-Key": apiKey },
    });
  } else {
    // DELETE somente para mim (endpoint WAHA para clear messages)
    await fetch(`${baseUrl}/api/${session}/chats/${chatId}/messages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Api-Key": apiKey },
      body: JSON.stringify({ messages: [message_id], deleteMedia: true }),
    });
  }
}
```

### Resumo de arquivos alterados

1. `src/modules/conversas/services/conversas.api.ts` - Remover condicional, sempre chamar WAHA
2. `supabase/functions/waha-proxy/index.ts` - Adicionar logica de `para_todos` na action existente
