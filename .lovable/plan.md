
# Refatoracao: Logica Unificada anti-duplicidade @lid/@c.us

## Diagnostico Confirmado

O problema ocorre em dois cenarios para mensagens individuais:

**Cenario A (mais comum):** 
1. Mensagem recebida: `rawFrom=162826672971943@lid` -- GOWS nao resolve -- cria conversa com `chat_id=162826672971943@lid`
2. Mensagem enviada: `toField=162826672971943@lid` -- GOWS resolve via `RecipientAlt` para `5513988506995@c.us` -- busca conversa por `5513988506995@c.us` -- NAO encontra -- cria NOVA conversa duplicada

**Cenario B (inverso):**
1. Mensagem enviada resolve para `5513988506995@c.us` -- cria conversa
2. Mensagem recebida nao resolve `@lid` -- cria outra conversa com `@lid`

A busca fuzzy por ultimos 8 digitos falha porque `162826672971943` e `5513988506995` NAO compartilham digitos.

## Solucao: Variavel `originalLidChatId` + Tentativa 4

### Mudanca 1: Preservar o `@lid` original antes da resolucao

No bloco INDIVIDUAL MESSAGE (linhas ~1281-1433), guardar o valor original do `@lid` ANTES de resolver para `@c.us`:

```text
let originalLidChatId: string | null = null;

// Para fromMe:
if (toField.includes("@lid")) {
  originalLidChatId = toField;  // <-- GUARDAR ANTES de resolver
  // ... resolucao existente ...
}

// Para received:
if (rawFrom.includes("@lid")) {
  originalLidChatId = rawFrom;  // <-- GUARDAR ANTES de resolver
  // ... resolucao existente ...
}
```

### Mudanca 2: Tentativa 4 na busca de conversa (STEP 2)

Apos Tentativa 3, adicionar busca pelo `@lid` original:

```text
// Tentativa 4: Se chatId foi resolvido de @lid para @c.us,
// buscar conversa existente pelo @lid original
if (!existingConversa && originalLidChatId && originalLidChatId !== chatId) {
  -> Buscar conversa com chat_id = originalLidChatId
  -> Se encontrar:
     - ATUALIZAR chat_id da conversa para o @c.us resolvido
     - ATUALIZAR contato vinculado (merge telefone)
     - Usar essa conversa
}

// Tentativa 4b: Inverso - chatId ainda e @lid, buscar conversa @c.us
// que tenha o mesmo contato_id (resolve via RPC ou mensagens)
if (!existingConversa && chatId.includes("@lid")) {
  -> Usar RPC resolve_lid_conversa para encontrar conversa real
  -> Se encontrar: usar essa conversa e atualizar chat_id
}
```

### Mudanca 3: Busca de contato com fallback @lid

No STEP 1 (busca/criacao de contato), adicionar tentativa de encontrar contato pelo `@lid` original:

```text
// Tentativa 3 (nova): Se phoneNumber foi resolvido de @lid,
// verificar se existe contato com telefone = lidNumber
if (!existingContato && originalLidChatId) {
  lidNumber = originalLidChatId.replace("@lid", "").replace("@c.us", "")
  -> Buscar contato com telefone = lidNumber
  -> Se encontrar: ATUALIZAR telefone para o numero real
}
```

### Mudanca 4: Limpeza dos dados atuais

SQL para corrigir as 20+ conversas e contatos duplicados existentes:

1. Para cada conversa com `chat_id` terminando em `@lid`:
   - Tentar resolver via `resolve_lid_conversa` RPC ou `raw_data` das mensagens
   - Se encontrar conversa `@c.us` correspondente: mover mensagens para a conversa `@c.us` e soft-delete a `@lid`
   - Se NAO encontrar: manter (sera resolvida automaticamente na proxima mensagem)

2. Merge de contatos duplicados (ex: Carlos Andia com telefone `162826672971943` e `5513988506995`)

## Arquivos Alterados

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Adicionar `originalLidChatId`, Tentativa 4 na busca de conversa, Tentativa 3 na busca de contato |
| Migracao SQL (dados) | Limpeza das conversas @lid duplicadas e merge de contatos |

## Detalhes Tecnicos

A refatoracao mantem a estrutura existente (nao reescreve tudo), apenas adiciona:

1. Uma variavel `originalLidChatId` (~3 linhas em 2 pontos)
2. Um bloco "Tentativa 4" no STEP 2 (~30 linhas)
3. Um bloco "Tentativa 3 contato" no STEP 1 (~15 linhas)
4. Logica de UPDATE do `chat_id` e `telefone` quando resolve @lid -> @c.us

Isso garante que **independente da ordem** (recebida primeiro ou enviada primeiro), o sistema sempre encontra a conversa existente e unifica.

## Resultado Esperado

- Conversas @lid sao automaticamente atualizadas para @c.us quando a resolucao acontece
- Contatos com telefone @lid sao atualizados para o numero real
- NUNCA mais cria conversa duplicada por divergencia @lid/@c.us
- Carlos Andia, Matheus da Costa e todos os outros aparecem em UMA unica conversa
