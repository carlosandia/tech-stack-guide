
# Correcao: Conversas Duplicadas por Sufixo de Device GOWS

## Diagnostico

O WAHA GOWS retorna nos campos `SenderAlt` e `RecipientAlt` um formato com **sufixo de device** (ex: `5513974079532:72@s.whatsapp.net`). O `:72` indica o dispositivo vinculado do contato.

O codigo atual faz `.replace("@s.whatsapp.net", "@c.us")` sem limpar o sufixo, resultando em:

| Cenario | Campo usado | Valor resolvido | Problema |
|---|---|---|---|
| Mensagem enviada (fromMe) | RecipientAlt | `5513974079532@c.us` | OK (sem sufixo neste caso) |
| Mensagem recebida | SenderAlt | `5513974079532:72@c.us` | DUPLICA - sufixo `:72` gera chatId diferente |

Isso cria **contato duplicado** (telefone `5513974079532:72` vs `5513974079532`) e **conversa duplicada** (chat_id diferente).

**Impacto atual**: 18 contatos e 2 conversas ja afetados no banco.

## Solucao

### 1. Webhook: Limpar sufixo de device em todos os pontos de resolucao

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Criar funcao utilitaria que remove o sufixo de device antes de usar o numero:

```typescript
function cleanDeviceSuffix(jid: string): string {
  // GOWS retorna "5513974079532:72@s.whatsapp.net" onde ":72" e o device ID
  // Precisamos limpar para "5513974079532@s.whatsapp.net"
  return jid.replace(/:\d+@/, "@");
}
```

Aplicar em **3 locais**:

- **Individual recebido** (linha ~1466): `SenderAlt` antes de `.replace("@s.whatsapp.net", "@c.us")`
- **Individual fromMe** (linha ~1346): `RecipientAlt` e `ChatAlt`/`SenderAlt`
- **Grupo** (linha ~1133): `SenderAlt` do participante

### 2. Migracao SQL: Corrigir dados existentes

```sql
-- Corrigir telefones com sufixo de device nos contatos
UPDATE contatos
SET telefone = REGEXP_REPLACE(telefone, ':\d+$', '')
WHERE telefone ~ ':\d+$' AND deletado_em IS NULL;

-- Corrigir chat_id com sufixo de device nas conversas
UPDATE conversas
SET chat_id = REGEXP_REPLACE(chat_id, ':\d+@', '@')
WHERE chat_id ~ ':\d+@c\.us' AND deletado_em IS NULL;

-- Mesclar conversas duplicadas (soft delete a duplicada, mover mensagens para a original)
-- Para cada par de conversas com mesmo numero base, mover mensagens da duplicada para a original
-- e soft delete a conversa duplicada
```

Logica de mesclagem para o caso do Danilo e outros afetados:
- Identificar pares de conversas com mesmo numero base (com e sem sufixo)
- Mover mensagens da conversa duplicada para a original
- Soft delete da conversa duplicada e do contato duplicado

### 3. Deduplicar contatos afetados

Mesclar os 18 contatos duplicados: manter o mais antigo (sem sufixo quando possivel) e redirecionar as referencias (conversas, oportunidades, etc.) para ele.

## Arquivos a Modificar

1. **`supabase/functions/waha-webhook/index.ts`** -- Funcao `cleanDeviceSuffix` + aplicar nos 3 pontos de resolucao
2. **Migracao SQL** -- Corrigir telefones, chat_ids, mesclar conversas e contatos duplicados

## Resultado Esperado

- Novas mensagens nunca mais criarao conversas/contatos duplicados por sufixo de device
- Conversas existentes duplicadas serao mescladas (mensagens unificadas)
- Contatos com telefone contendo `:XX` serao corrigidos
