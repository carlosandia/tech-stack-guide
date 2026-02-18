
# Correção: Reações não aparecem + Mensagens no contato errado

## Problema 1: Reações não aparecem na UI

**Causa raiz**: O `message_id` da mensagem original e o `reaction_message_id` da reação usam formatos diferentes de chatId.

- Mensagem armazenada com: `false_65275349192889@lid_3ACF2DEE9059E92FACCA`
- Reação referencia como: `false_5513974053443@c.us_3ACF2DEE9059E92FACCA`
- O stanza ID (`3ACF2DEE9059E92FACCA`) é idêntico, mas o sistema compara a string completa e não encontra correspondência.

**Solução**: Normalizar a correspondência entre reações e mensagens no frontend, usando o stanza ID (ultimo segmento) como fallback.

## Problema 2: Mensagens indo para conversa do Keven

**Causa raiz (dados corrompidos)**: O contato "Keven Litoral Place" (`325aca6b`) está com telefone `553584723836`, mas o telefone real dele é outro (a conversa dele tem `chat_id = 5513974069392@c.us`). Outro contato "Maito" (`fe7a5828`) também tem o mesmo telefone `553584723836`. Isso causa:

1. A busca exata por telefone (`maybeSingle()`) falha porque retorna 2 contatos
2. A busca fuzzy encontra um dos dois (pode ser o Keven)
3. Antes do fix anterior, o Tentativa 1c roteava pela contato_id errada

**Solução**: Correção de dados + prevenção contra duplicatas.

## Detalhes Técnicos

### Arquivo 1: `src/modules/conversas/components/ChatMessages.tsx`

**Alterar o `reactionsMap` (linhas 134-152)**: Além de indexar pelo `reaction_message_id` completo, também indexar pelo stanza ID (ultimo segmento separado por `_`). Isso garante correspondência mesmo quando o chatId difere entre @lid e @c.us.

**Alterar a busca de reações (linha 233)**: Tentar primeiro pelo `message_id` completo, depois pelo stanza ID como fallback.

```text
// reactionsMap: indexar por stanza ID também
const stanzaId = extractStanzaId(key)
if (stanzaId && stanzaId !== key) {
  // Merge com possível entrada existente pelo stanza
  map.set(stanzaId, existing)
}

// Lookup: tentar message_id completo, depois stanza ID
const msgReactions = msg.message_id 
  ? (reactionsMap.get(msg.message_id) || reactionsMap.get(extractStanzaId(msg.message_id)))
  : undefined
```

### Arquivo 2: `supabase/functions/waha-webhook/index.ts`

**Alterar busca exata de contato (linhas 1691-1697)**: Adicionar `.limit(1)` ANTES do `.maybeSingle()` para evitar erro quando existem contatos duplicados com mesmo telefone.

```text
ANTES:
.eq("telefone", phoneNumber)
.is("deletado_em", null)
.maybeSingle();

DEPOIS:
.eq("telefone", phoneNumber)
.is("deletado_em", null)
.limit(1)
.maybeSingle();
```

### Correção de dados (SQL manual)

Corrigir o telefone do contato Keven para refletir o numero real (baseado no chat_id da conversa dele):

```text
UPDATE contatos 
SET telefone = '5513974069392' 
WHERE id = '325aca6b-256e-4158-a79c-44834906e6bf' 
  AND telefone = '553584723836';
```

E mover as 2 mensagens incorretas de volta para a conversa do Maito (`e9af85da`) ou removê-las:

```text
UPDATE mensagens 
SET conversa_id = 'e9af85da-00a9-4833-b728-1832e57b575c' 
WHERE id IN ('33f0d12d-5411-4815-b048-ca53d3d47608', '94fb8641-852c-4df3-ad38-e1af52f7b777');
```

Essas queries SQL devem ser executadas no painel do Supabase (Cloud View > Run SQL).
