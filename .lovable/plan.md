

# Simplificacao da Sincronizacao de Etiquetas

## Situacao Atual

O sistema possui **tres mecanismos** para sincronizar etiquetas:

1. **Webhooks** (`waha-webhook`): processam `label.upsert`, `label.chat.added`, `label.chat.deleted` em tempo real -- ja implementado e funcional
2. **Polling pesado a cada 15s** (`ConversasPage.tsx`): chama `labels_list` no `waha-proxy`, que faz 1 request para cada conversa ativa (ate 500 requests a cada 15s)
3. **Sync ao focar aba / selecionar conversa**: tambem chama `labels_list` (mesma carga pesada)

O polling de 15s e extremamente custoso: para 50 conversas ativas, sao 50+ requests HTTP a cada 15 segundos. Alem disso, o `labels_list` faz DELETE ALL + INSERT em batch, o que pode causar "piscar" de etiquetas na interface.

## Proposta: Confiar nos Webhooks + Polling Leve

### 1. Frontend: Reduzir polling de 15s para 60s (health check)

**Arquivo:** `src/modules/conversas/pages/ConversasPage.tsx`

- Mudar o `setInterval` de `15000` para `60000` (60 segundos)
- Isso torna o polling um "health check" de seguranca, nao o mecanismo principal
- Manter o sync ao focar aba (visibilitychange) e ao montar a pagina

### 2. Backend `waha-proxy`: Simplificar `labels_list`

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

A action `labels_list` continuara:
- Sincronizando as **definicoes de labels** (nomes, cores) via `GET /labels` (1 unico request)
- Reconfigurar webhooks se necessario (manter logica existente)

Mas ao inves de iterar por cada conversa ativa (N requests), usara uma estrategia mais leve:
- Chamar `GET /labels` para obter as labels e suas propriedades
- Para cada label retornada pela API, verificar se possui campo `chatIds` ou similar (alguns endpoints WAHA retornam isso)
- Se nao houver dados de associacao no endpoint simples, **nao faz o full sync de associacoes** -- confia nos webhooks para manter `conversas_labels` atualizado

Caso o endpoint `GET /labels` retorne a lista de chats por label (alguns engines do WAHA fazem isso), usar esses dados diretamente. Caso contrario, pular o sync de associacoes no polling e confiar 100% nos webhooks.

### 3. Manter Realtime do Supabase

O `useConversasRealtime.ts` ja escuta INSERT/DELETE em `conversas_labels` e `*` em `whatsapp_labels`. Quando o webhook insere/remove uma associacao, o Supabase Realtime invalida o cache automaticamente -- isso ja funciona.

### 4. Remover sync ao selecionar conversa

**Arquivo:** `src/modules/conversas/pages/ConversasPage.tsx`

No `handleSelectConversa`, remover a chamada `sincronizarLabels.mutate()`. Ao selecionar uma conversa, os dados ja estarao atualizados via webhook + realtime. Isso reduz chamadas desnecessarias.

## Resultado Esperado

```text
Antes:
  - 15s polling → N requests por conversa (50+ requests a cada 15s)
  - DELETE ALL + INSERT em batch a cada 15s
  - Visibilidade e selecao de conversa = mais N requests

Depois:
  - Webhooks em tempo real (latencia < 2s)
  - Realtime Supabase invalida cache instantaneamente
  - 60s polling = apenas 1 request GET /labels (definicoes, nao associacoes)
  - Menor carga no servidor WAHA e no Supabase
```

## Detalhes Tecnicos

### Alteracoes por arquivo:

**`src/modules/conversas/pages/ConversasPage.tsx`:**
- Linha 110: mudar `15000` para `60000`
- Linhas 126-131: remover `sincronizarLabels.mutate()` do `handleSelectConversa`

**`supabase/functions/waha-proxy/index.ts`:**
- Linhas 1374-1507 (bloco de sync "labels per chat"): substituir por um sync simplificado que apenas sincroniza as definicoes de labels sem iterar por cada conversa. O bloco pesado de N requests sera removido.
- Manter o upsert de definicoes de labels (nomes, cores) que ja existe nas linhas 1361-1372

### Risco e Mitigacao

- **Risco**: se webhooks falharem, labels ficam dessincronizadas ate o proximo polling (60s)
- **Mitigacao**: o botao manual "Sincronizar" no LabelsPopover continua funcionando e pode disparar o full sync quando o usuario perceber inconsistencia
- **Mitigacao extra**: manter no `labels_list` a opcao de full sync, mas so executar quando chamado manualmente (nao no polling automatico)

