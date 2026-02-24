

# Implementar indicador de presenca (online/digitando) no ChatHeader

## Contexto

A API WAHA GOWS suporta presenca via:
- `POST /api/{session}/presence/{chatId}/subscribe` — inscreve-se para receber updates de presenca de um contato
- `GET /api/{session}/presence/{chatId}` — consulta a presenca atual
- Evento webhook `presence.update` — recebe atualizacoes em tempo real

Atualmente o sistema nao utiliza nenhuma dessas funcionalidades. O header do chat exibe apenas nome + icone do canal + etiquetas, sem indicacao de status online/digitando.

## Plano de implementacao

### 1. Nova action na Edge Function `waha-proxy` 

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Adicionar dois novos cases no switch de actions:

- **`presence_subscribe`** — Chama `POST /api/{session}/presence/{chatId}/subscribe` para ativar o monitoramento de presenca do contato. Sem body.
- **`presence_get`** — Chama `GET /api/{session}/presence/{chatId}` e retorna o JSON com `lastKnownPresence` e `lastSeen`.

Ambos recebem `chat_id` no body da request.

### 2. Adicionar evento `presence.update` ao webhook

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Adicionar `"presence.update"` ao array `webhookEvents` (linha 144) para que novas sessoes recebam esse evento. Sessoes existentes precisarao reconectar para aplicar.

### 3. Processar evento `presence.update` no webhook

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

Adicionar handler para o evento `presence.update`. Ao receber, faz broadcast via Supabase Realtime (canal customizado) com o payload `{ chatId, presence, lastSeen }` para que o frontend receba em tempo real sem polling.

A estrategia sera: inserir/atualizar um registro numa tabela lightweight ou usar Realtime Broadcast diretamente (sem persistencia em banco — presenca e efemera).

### 4. Novo hook `usePresence`

**Arquivo:** `src/modules/conversas/hooks/usePresence.ts`

Hook que:
- Recebe `conversaId`, `chatId`, `sessionName` e `canal`
- Ao montar, chama `presence_subscribe` via waha-proxy para se inscrever
- Chama `presence_get` para obter o status inicial
- Escuta canal Realtime broadcast `presence:{chatId}` para updates em tempo real
- Retorna `{ status: 'online' | 'offline' | 'typing' | 'recording' | null, lastSeen: number | null }`
- Ao desmontar, limpa o canal Realtime
- Ignora se `canal !== 'whatsapp'`

### 5. Atualizar ChatHeader com indicador de presenca

**Arquivo:** `src/modules/conversas/components/ChatHeader.tsx`

- Chamar `usePresence` com os dados da conversa
- Abaixo do nome do contato (dentro do `div.min-w-0`), adicionar uma segunda linha com texto pequeno:
  - **"online"** — texto verde `text-[11px] text-green-500`
  - **"digitando..."** — texto verde com animacao sutil
  - **"gravando audio..."** — texto verde 
  - **"offline"** / sem dados — nao exibe nada (comportamento atual)
- A estrutura fica:

```text
Nome do Contato  [icone WhatsApp]
online                              <-- nova linha
```

## Estrutura visual resultante

```text
+----------------------------------------------------------+
| [<] [Avatar] Nome Contato [WA]  Etiquetas  | [Q][T][+] Aberta [...]
|             digitando...                    |
+----------------------------------------------------------+
```

## Detalhes tecnicos

### Edge Function — actions presence

```typescript
case "presence_subscribe": {
  const { chat_id } = body;
  wahaResponse = await fetch(
    `${baseUrl}/api/${sessionId}/presence/${chat_id}/subscribe`,
    { method: "POST", headers: { "X-Api-Key": apiKey } }
  );
  break;
}

case "presence_get": {
  const { chat_id } = body;
  wahaResponse = await fetch(
    `${baseUrl}/api/${sessionId}/presence/${chat_id}`,
    { method: "GET", headers: { "X-Api-Key": apiKey } }
  );
  break;
}
```

### Webhook — presence.update handler

Usar Realtime Broadcast para enviar o evento diretamente ao frontend sem persistir em banco:

```typescript
if (event === "presence.update") {
  const chatId = payload.id;
  const presences = payload.presences;
  // Broadcast via Supabase channel
  await supabaseAdmin.channel(`presence:${sessionName}`)
    .send({
      type: 'broadcast',
      event: 'presence_update',
      payload: { chatId, presences }
    });
}
```

### Hook usePresence

```typescript
function usePresence(chatId: string, sessionName: string, canal: string) {
  const [presence, setPresence] = useState<string | null>(null);

  useEffect(() => {
    if (canal !== 'whatsapp' || !sessionName || !chatId) return;
    // Subscribe via waha-proxy
    supabase.functions.invoke('waha-proxy', {
      body: { action: 'presence_subscribe', chat_id: chatId, session_name: sessionName }
    });
    // Get initial
    supabase.functions.invoke('waha-proxy', {
      body: { action: 'presence_get', chat_id: chatId, session_name: sessionName }
    }).then(({ data }) => {
      const p = data?.presences?.[0]?.lastKnownPresence;
      if (p) setPresence(p);
    });
    // Listen broadcast
    const channel = supabase.channel(`presence:${sessionName}`)
      .on('broadcast', { event: 'presence_update' }, ({ payload }) => {
        if (payload.chatId === chatId) {
          setPresence(payload.presences?.[0]?.lastKnownPresence || 'offline');
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatId, sessionName, canal]);

  return presence;
}
```

### Arquivos modificados

| Arquivo | Tipo |
|---|---|
| `supabase/functions/waha-proxy/index.ts` | Editar — adicionar actions + evento webhook |
| `supabase/functions/waha-webhook/index.ts` | Editar — handler presence.update |
| `src/modules/conversas/hooks/usePresence.ts` | Criar — hook de presenca |
| `src/modules/conversas/components/ChatHeader.tsx` | Editar — exibir status abaixo do nome |

