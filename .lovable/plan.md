

## Correção: Presença (online/digitando) não funciona no chat

### Diagnóstico

Investiguei os logs e o código e identifiquei **a causa raiz**:

A sessão WAHA (`crm_893fb161`) foi criada **antes** do evento `presence.update` ser adicionado à lista de webhook events. A sessão continua rodando com a configuração antiga, então o WAHA nunca envia eventos de presença para o webhook.

**Evidências:**
- Os logs do `waha-proxy` confirmam que `presence_subscribe` (201) e `presence_get` (200) funcionam corretamente no WAHA
- Os logs do `waha-webhook` mostram ZERO eventos `presence.update` — o WAHA simplesmente não envia porque a sessão não está configurada para isso
- Já existe um mecanismo de reconfiguração automática no `waha-proxy` para labels (`label.upsert`, `label.chat.added`), mas **não existe verificação equivalente para `presence.update`**

### Solução

Adicionar verificação de `presence.update` na lógica de reconfiguração automática de webhooks do `waha-proxy`. Assim, quando qualquer ação de presença for chamada, o sistema detecta que a sessão está desatualizada e atualiza os webhook events automaticamente — sem precisar reconectar.

### Arquivo modificado

**`supabase/functions/waha-proxy/index.ts`**

Na action `presence_subscribe`, antes de chamar a API do WAHA:

1. Buscar a configuração atual da sessão via `GET /api/sessions/{sessionId}`
2. Verificar se os webhooks incluem `presence.update`
3. Se não incluir, fazer `PUT` para atualizar os webhook events (usando a mesma lista `webhookEvents` completa)
4. Só então prosseguir com o `presence_subscribe`

Isso reutiliza exatamente o mesmo padrão já implementado para labels (linhas ~1305-1375), apenas aplicado ao contexto de presença.

### Detalhes técnicos

```text
Fluxo quando o usuário abre um chat:
  1. usePresence chama presence_subscribe via waha-proxy
  2. waha-proxy verifica GET /api/sessions/{sessionId}
  3. Se webhooks NÃO contém "presence.update":
     -> PUT /api/sessions/{sessionId}/ com webhookEvents completo
     -> Log de confirmação
  4. Prossegue com POST /api/{sessionId}/presence/{chatId}/subscribe
  5. WAHA agora envia presence.update -> waha-webhook -> broadcast -> UI
```

Nenhuma ação manual do usuário será necessária (sem reconectar WhatsApp).
