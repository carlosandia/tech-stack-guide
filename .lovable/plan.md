

## Correção: Desconectar WhatsApp + ACK (Ticks) em Tempo Real

---

### Problema 1: Desconectar não gera novo QR code (JA APROVADO)

O `case "desconectar"` no `waha-proxy` apenas chama `POST /api/sessions/stop`, que para a sessão mas mantém as credenciais salvas. Ao reconectar, o WAHA reutiliza as credenciais e reconecta automaticamente ao mesmo número.

**Correção:** Executar logout + stop + delete na sessão WAHA antes de atualizar o banco.

### Problema 2: Ticks de status (ACK) não atualizam em tempo real

Identifiquei a causa raiz: o hook `useConversasRealtime` escuta apenas:
- `INSERT` na tabela `mensagens` (novas mensagens)
- `UPDATE` na tabela `conversas` (atualização de conversa)

Quando o webhook recebe um evento `message.ack` e faz UPDATE na tabela `mensagens` (atualizando `ack` e `ack_name`), **nenhum listener captura essa mudança**. O frontend nunca sabe que o ACK foi atualizado, por isso fica eternamente em 1 tick.

O backend (webhook) já está correto -- ele processa o `message.ack` e atualiza o banco. O problema é puramente no frontend, que não escuta UPDATE na tabela de mensagens.

---

## Plano de Implementação

### Etapa 1 - Corrigir `desconectar` no waha-proxy

**Arquivo:** `supabase/functions/waha-proxy/index.ts` (linhas 376-391)

Substituir o case `desconectar` por:
1. `POST /api/sessions/{sessionId}/logout` - desemparelha o WhatsApp
2. `POST /api/sessions/stop` com `logout: true` - para a sessão
3. `DELETE /api/sessions/{sessionId}` - remove completamente do WAHA
4. Atualizar banco: `status: "disconnected"`, limpar `phone_number` e `phone_name`

### Etapa 2 - Adicionar listener de UPDATE em mensagens no Realtime

**Arquivo:** `src/modules/conversas/hooks/useConversasRealtime.ts`

Adicionar um terceiro listener no canal Supabase Realtime:

```text
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'mensagens',
  filter: `organizacao_id=eq.${organizacaoId}`,
}, (payload) => {
  // Invalida mensagens da conversa para re-buscar com ACK atualizado
  queryClient.invalidateQueries({ queryKey: ['mensagens', payload.new.conversa_id] })
})
```

Isso fará com que qualquer UPDATE na tabela `mensagens` (incluindo atualizações de ACK) invalide o cache do React Query, forçando um re-fetch das mensagens com os novos valores de `ack`.

### Etapa 3 - Deploy das Edge Functions

Após as alterações, deploy de `waha-proxy` para aplicar a correção do desconectar.

---

## Detalhes Técnicos

### Fluxo de ACK corrigido:

```text
WhatsApp entrega/lê a mensagem
    |
    v
WAHA envia evento "message.ack" para waha-webhook
    |
    v
waha-webhook faz UPDATE em mensagens (ack=3, ack_name="DELIVERED")
    |
    v
Supabase Realtime detecta UPDATE na tabela mensagens  <-- NOVO
    |
    v
useConversasRealtime recebe evento e invalida cache
    |
    v
React Query refaz busca das mensagens
    |
    v
ChatMessageBubble renderiza com novo AckIndicator (2 ticks cinza/azul)
```

### Mapeamento de ACK (já implementado no AckIndicator):

| ACK | Visual | Significado |
|-----|--------|-------------|
| 0 | (nada) | ERROR |
| 1 | 1 tick cinza | PENDING (enviado ao servidor) |
| 2 | 2 ticks cinza | SENT (saiu do servidor) |
| 3 | 2 ticks cinza | DELIVERED (entregue ao destinatário) |
| 4 | 2 ticks azuis | READ (lido) |
| 5 | 2 ticks azuis + play | PLAYED (reproduzido - áudio/vídeo) |

### Fluxo de desconectar corrigido:

```text
Usuário clica "Desconectar"
    |
    v
waha-proxy: POST /api/sessions/{session}/logout
    |
    v
waha-proxy: POST /api/sessions/stop (logout: true)
    |
    v
waha-proxy: DELETE /api/sessions/{session}
    |
    v
UPDATE sessoes_whatsapp: status=disconnected, phone=null
    |
    v
Usuário clica "Conectar"
    |
    v
waha-proxy: POST /api/sessions/start (sessão nova)
    |
    v
WAHA retorna SCAN_QR_CODE -> novo QR exibido
```

### Arquivos a serem editados:

1. `supabase/functions/waha-proxy/index.ts` - Case `desconectar` (linhas 376-391)
2. `src/modules/conversas/hooks/useConversasRealtime.ts` - Novo listener UPDATE em mensagens

