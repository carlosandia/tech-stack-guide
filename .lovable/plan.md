
# Correção: Etiquetas do WhatsApp não sincronizando em tempo real

## Diagnostico

Analisei os logs e o código completamente. Encontrei **2 problemas distintos**:

### Problema 1: Webhooks de label nao estao chegando
Os logs do `waha-webhook` mostram ZERO eventos `label.*` apesar da reconfiguração via PUT ter sido executada. A reconfiguração logou sucesso (`"Reconfiguring webhooks to include label events"`) mas o WAHA tem um **bug conhecido** onde o PUT na sessão pode não aplicar novos eventos de webhook sem reiniciar. A solução é garantir que o PATCH/PUT inclua o campo `name` correto e, se falhar, usar stop+start como fallback (assim como já é feito no `status`).

Porém, o problema **mais grave** é que mesmo quando o webhook label.chat.added chegar, ele precisa que a label já exista no banco. Se a label não existir, o handler simplesmente ignora (`label=false - skipping`). Precisamos adicionar auto-criação da label quando o webhook chega e ela não existe no banco.

### Problema 2: Sincronização manual (labels_list) não insere associações
O log mostra `"Synced label associations for 10 conversations"` mas a tabela `conversas_labels` está **vazia**. Isso indica que o endpoint `GET /api/{session}/labels/chats/{chatId}/` do WAHA está retornando arrays vazios para todos os chats. Este é um **bug conhecido do WAHA** (issue #1370) onde a API de labels por chat pode retornar vazio mesmo com labels aplicadas.

A solução é usar a abordagem inversa: `GET /api/{session}/labels/{labelId}/chats` (buscar chats por label) em vez de buscar labels por chat.

---

## Plano de Correção

### 1. Edge Function `waha-proxy` - Inverter estratégia de sync

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

Na action `labels_list`, substituir o loop que busca labels POR CHAT pelo loop inverso que busca CHATS POR LABEL:

```text
Para cada label sincronizada no DB:
  GET /api/{session}/labels/{labelId}/chats
  Para cada chatId retornado:
    Buscar conversa no DB pelo chat_id
    Se existir, inserir em conversas_labels
```

Isso contorna o bug #1370 do WAHA onde `labels/chats/{chatId}` retorna vazio.

Adicionar logging detalhado para cada label processada e quantos chats foram encontrados.

### 2. Edge Function `waha-webhook` - Auto-criar label ausente

**Arquivo:** `supabase/functions/waha-webhook/index.ts`

No handler `label.chat.added`, quando a label não existe no banco (`label=null`):
- Buscar a label na API WAHA: `GET /api/{session}/labels/{labelId}`
- Inserir no banco `whatsapp_labels`
- Continuar com a inserção em `conversas_labels`

Isso resolve o cenário onde o webhook chega antes da sincronização manual.

### 3. Edge Function `waha-proxy` - Forçar reconfiguração robusta de webhooks

Na action `labels_list`, após o PUT de reconfiguração, verificar se realmente aplicou lendo a sessão novamente. Se os label events ainda não estiverem registrados, fazer o fallback stop+start (com `logout: false` para não perder a conexão).

### 4. Frontend - Auto-sync mais robusto

**Arquivo:** `src/modules/conversas/pages/ConversasPage.tsx`

O auto-sync atual roda a cada mount da página, mas só quando tem conversas. Melhorar para:
- Rodar apenas uma vez por sessão do navegador (usar ref para controlar)
- Não depender da lista de labels estar vazia

---

## Secao Tecnica - Detalhes

### Mudança no waha-proxy (labels_list sync)

Trocar:
```typescript
// ANTES: busca labels por chat (bug WAHA #1370 - retorna vazio)
for (const conversa of conversasAtivas) {
  const chatLabelsResp = await fetch(
    `${baseUrl}/api/${sessionId}/labels/chats/${encodeURIComponent(conversa.chat_id)}/`
  );
}
```

Por:
```typescript
// DEPOIS: busca chats por label (funciona corretamente)
for (const label of labelsData) {
  const chatsResp = await fetch(
    `${baseUrl}/api/${sessionId}/labels/${label.id}/chats`
  );
  // Para cada chat retornado, vincular no banco
}
```

### Mudança no waha-webhook (label.chat.added)

Adicionar bloco de auto-fetch quando `label === null`:
```typescript
if (!label && sessao) {
  // Buscar dados da label na API WAHA
  const wahaApiUrl = Deno.env.get("WAHA_API_URL") || configData?.waha_url;
  const resp = await fetch(`${wahaApiUrl}/api/${sessionName}/labels/${labelPayload.labelId}`);
  if (resp.ok) {
    const labelData = await resp.json();
    // Inserir no banco e continuar
  }
}
```

### Ordem de implementação
1. Corrigir `waha-proxy` (sync invertido + reconfig robusta)
2. Corrigir `waha-webhook` (auto-criar label ausente)
3. Ajustar frontend (auto-sync controlado)
4. Deploy e teste
