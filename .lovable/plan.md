
# Correcao: Pre-oportunidades mostrando LID em vez de nome/telefone real

## Problema

Quando o WhatsApp GOWS nao consegue resolver um identificador `@lid` para `@c.us`, o webhook armazena o numero LID (ex: `64188537950415`) como `phone_number` na tabela `pre_oportunidades`. Isso causa dois problemas:

1. **Card de Solicitacao mostra o LID** em vez do nome do contato (ex: "64188537950415" em vez de "Eletrikus Pos Venda")
2. **Modal WhatsApp nao encontra a conversa** porque busca `chat_id = 64188537950415@c.us`, mas a conversa real tem outro `chat_id`

## Causa Raiz

No webhook (`waha-webhook/index.ts`), o STEP 4 (criacao de pre-oportunidade, linha ~3001) usa a variavel `phoneNumber` diretamente. Porem, nesse ponto do fluxo, o webhook ja encontrou o contato real via fuzzy match ou RPC resolve_lid e ja tem:
- `existingContato.telefone` = telefone real
- `existingContato.nome` = nome real
- `chatId` = chat_id resolvido

Mas esses dados nao sao usados na pre-oportunidade.

## Solucao

### 1. Webhook: Usar dados resolvidos na pre-oportunidade

**Arquivo:** `supabase/functions/waha-webhook/index.ts` (STEP 4, linhas ~3001-3050)

Antes de criar/atualizar a pre-oportunidade, usar o telefone real do contato encontrado:

```text
// Determinar phone real para pre-op (preferir contato existente sobre phoneNumber bruto)
const preOpPhone = existingContato?.telefone || phoneNumber;
const preOpName = phoneName || existingContato?.nome || null;
```

Substituir `phoneNumber` por `preOpPhone` e `phoneName` por `preOpName` nas queries de busca e insert/update da pre-oportunidade.

### 2. WhatsAppConversaModal: Busca mais robusta

**Arquivo:** `src/modules/negocios/components/kanban/WhatsAppConversaModal.tsx`

Quando `contatoId` esta vazio (caso de pre-oportunidades), alem de buscar por `chat_id` exato, adicionar fallback por sufixo dos ultimos 8 digitos do telefone usando `ilike` no `chat_id`. Isso cobre o caso onde o phone_number ainda e um LID nao resolvido.

### 3. SolicitacoesColumn: Tentar nome do contato

**Arquivo:** `src/modules/negocios/services/pre-oportunidades.api.ts`

Na query de `listarPendentes`, fazer join com `contatos` via telefone para buscar o nome real quando `phone_name` esta null. Alternativa mais simples: apenas garantir que o webhook salve os dados corretos (item 1), que resolve o problema na raiz.

## Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | STEP 4: usar telefone/nome do contato resolvido |
| `src/modules/negocios/components/kanban/WhatsAppConversaModal.tsx` | Busca de conversa com fallback por sufixo |

## Observacao

Os registros existentes de pre-oportunidades que ja tem LID como `phone_number` nao serao corrigidos automaticamente. A proxima mensagem recebida desse contato atualizara o `phone_name` e `phone_number` corretamente. Para dados historicos, pode-se rodar um UPDATE manual cruzando com a tabela `contatos`.
