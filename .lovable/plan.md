

# Correcao de Ordem e ACK em Mensagens Rapidas do Dispositivo

## Problema 1: Ordem das Mensagens no CRM

### Diagnostico

No WhatsApp (dispositivo), as mensagens enviadas rapidamente aparecem na ordem correta: `1, 2, 3, 4, 50`. No CRM, aparecem fora de ordem: `2, 3, 4, 1, 50`.

**Causa raiz**: O `ChatMessages.tsx` ordena por `criado_em` (timestamp de insercao no banco de dados). Quando varias mensagens sao enviadas rapidamente pelo dispositivo, o WAHA dispara webhooks em paralelo. O tempo de processamento de cada webhook varia (ex: mensagem "1" pode demorar mais por media, ou simplesmente chegar em ordem diferente ao edge function). O `criado_em` reflete quando o banco INSERIU a linha, nao quando a mensagem foi enviada.

**Solucao**: Ordenar por `timestamp_externo` (timestamp do WhatsApp, que reflete a ordem real no dispositivo), com fallback para `criado_em` quando `timestamp_externo` e nulo.

### Problema 2: ACKs Perdidos em Mensagens Rapidas

No CRM, algumas mensagens do segundo teste (A, S, D, F, G...) aparecem sem ticks. A mensagem "1" do primeiro teste tambem ficou sem tick.

**Causa raiz**: O retry de 2 segundos implementado anteriormente cobre 1 race condition, mas quando 10+ mensagens sao enviadas em rafaga, multiplos `message.ack` eventos podem chegar antes dos respectivos `message.any` serem processados. O retry unico de 2s nao e suficiente para todos.

**Solucao**: Implementar retry progressivo (2s + 3s = duas tentativas) para cobrir rafagas maiores.

---

## Mudancas Tecnicas

### Arquivo 1: `src/modules/conversas/components/ChatMessages.tsx`

Alterar a funcao de sort no `sortedMessages` para usar `timestamp_externo` como criterio primario:

```typescript
// ANTES:
return [...filtered].sort(
  (a, b) => new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
)

// DEPOIS:
return [...filtered].sort((a, b) => {
  // Usar timestamp_externo (WhatsApp) como criterio primario para ordem correta
  const tsA = a.timestamp_externo ? a.timestamp_externo * 1000 : new Date(a.criado_em).getTime()
  const tsB = b.timestamp_externo ? b.timestamp_externo * 1000 : new Date(b.criado_em).getTime()
  if (tsA !== tsB) return tsA - tsB
  // Desempate por criado_em quando timestamps sao iguais
  return new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime()
})
```

### Arquivo 2: `src/modules/conversas/services/conversas.api.ts`

Na funcao `listarMensagens`, alterar a ordenacao da query para usar `timestamp_externo` tambem no banco:

```typescript
// ANTES:
.order('criado_em', { ascending: orderDir === 'asc' })

// DEPOIS:
.order('timestamp_externo', { ascending: orderDir === 'asc', nullsFirst: false })
.order('criado_em', { ascending: orderDir === 'asc' })
```

### Arquivo 3: `supabase/functions/waha-webhook/index.ts`

No bloco de retry do `message.ack`, adicionar uma segunda tentativa apos 3 segundos adicionais (total 5s) para cobrir rafagas de 10+ mensagens:

```text
Fluxo atual:
  busca exata -> fallback ilike -> retry 2s -> (desiste)

Fluxo novo:
  busca exata -> fallback ilike -> retry 2s -> retry 3s -> (desiste)
```

Apos o bloco de retry existente (que espera 2s), se ainda nao encontrou, esperar mais 3s e tentar novamente.

### Arquivo 4: `src/modules/conversas/hooks/useMensagens.ts`

Na funcao `useMensagens`, a query `listarMensagens` ja usa `order_dir: 'desc'`. Sem alteracao necessaria aqui, pois o sort final e feito no `ChatMessages.tsx`.

---

## Resumo

| Arquivo | Alteracao |
|---------|-----------|
| `ChatMessages.tsx` | Sort por `timestamp_externo` (primario) + `criado_em` (fallback) |
| `conversas.api.ts` | Query com `.order('timestamp_externo')` primario |
| `waha-webhook/index.ts` | Segundo retry de 3s apos o retry de 2s existente |

## Impacto

- Mensagens sempre aparecerao na ordem do WhatsApp, independente da ordem de processamento do webhook
- ACKs de rafagas de ate ~15 mensagens serao recuperados com o retry duplo (2s + 3s)
- Nenhuma migracao de banco necessaria (`timestamp_externo` ja existe como coluna)

