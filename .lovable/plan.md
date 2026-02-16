
# Correcao: Mensagens Silenciosamente Descartadas pelo Indice UNIQUE Global

## Diagnostico

Existem **dois indices UNIQUE conflitantes** na tabela `mensagens`:

| Indice | Definicao | Status |
|---|---|---|
| `idx_mensagens_message_id_unique` | `UNIQUE(message_id) WHERE deletado_em IS NULL` | DEVERIA TER SIDO REMOVIDO -- causa o bug |
| `idx_mensagens_unique` | `UNIQUE(organizacao_id, message_id) WHERE deletado_em IS NULL` | Correto, mas nao esta sendo usado |

O webhook faz `.upsert(messageInsert, { onConflict: "message_id", ignoreDuplicates: true })`, que resolve contra o indice **global**. Quando um `message_id` ja existe em outra organizacao, o upsert silenciosamente descarta a mensagem. A conversa e criada normalmente, mas nenhuma mensagem e persistida.

**Conversas afetadas atualmente (0 mensagens):**
- Rafa Lobo (19496216448@c.us) -- total_mensagens=22, real=0
- "." (5511986096402@c.us) -- total_mensagens=5, real=0
- "." (5513981294528@c.us) -- total_mensagens=20, real=0

**Este e um problema sistemico**: todas as proximas conversas com `message_id` coincidente entre organizacoes terao mensagens perdidas silenciosamente.

## Solucao

### 1. Migracao SQL: Remover indice global + resetar contadores

```sql
-- Remover o indice global que causa o conflito entre organizacoes
DROP INDEX IF EXISTS idx_mensagens_message_id_unique;

-- Resetar contadores das conversas afetadas para refletir a realidade
UPDATE conversas
SET total_mensagens = 0, mensagens_nao_lidas = 0
WHERE id IN (
  'eaa5f71d-ba2f-465d-bb4d-540cb28bf792',
  '7576ec19-9ea7-47ed-95a2-e9df5dc6bbcc',
  '4f191c3e-9f29-47e5-817f-d647ef231c83'
);
```

O indice composto `idx_mensagens_unique(organizacao_id, message_id)` ja existe e continuara prevenindo duplicatas dentro da mesma organizacao.

### 2. Webhook: Ajustar onConflict para usar indice composto

**Arquivo**: `supabase/functions/waha-webhook/index.ts` (linha ~2387)

Alterar de:
```typescript
.upsert(messageInsert, { onConflict: "message_id", ignoreDuplicates: true })
```

Para:
```typescript
.upsert(messageInsert, { onConflict: "organizacao_id,message_id", ignoreDuplicates: true })
```

Isso garante que o upsert usa o indice correto escopado por organizacao.

## Arquivos a Modificar

1. **Migracao SQL** -- Drop do indice global, reset de contadores
2. **`supabase/functions/waha-webhook/index.ts`** -- Corrigir `onConflict` para `"organizacao_id,message_id"`

## Resultado Esperado

- Novas mensagens nunca mais serao descartadas por conflito entre organizacoes
- As 3 conversas afetadas terao contadores zerados (mensagens perdidas so recuperaveis via sync WAHA)
- O indice composto `idx_mensagens_unique` continuara prevenindo duplicatas reais dentro da mesma org
