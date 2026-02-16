
# Correcao Definitiva: Duplicidade @lid vs @c.us

## Diagnostico da Causa Raiz

O problema persiste por **dois bugs interligados** na logica atual:

### Bug 1: RPC `resolve_lid_conversa` retorna a propria conversa @lid

Quando uma mensagem chega com `chatId=91057635229851@lid`, a Tentativa 4b chama a RPC para encontrar uma conversa @c.us correspondente. Porem a RPC busca mensagens cujo `raw_data` contem o texto `91057635229851` - e as mensagens da PROPRIA conversa @lid tambem contem esse numero! Resultado: a RPC retorna a conversa @lid (ela mesma), nao a conversa @c.us que seria o merge correto.

### Bug 2: Tentativa 3 (busca por telefone) falha com numeros @lid

A Tentativa 3 busca conversas por `ilike("chat_id", "%${lastDigits}%")` usando os ultimos 8 digitos do phoneNumber. Porem quando o phoneNumber e um @lid (ex: `91057635229851`), os ultimos 8 digitos (`35229851`) NAO existem no chat_id da conversa real (`5513991415709@c.us`). A busca fuzzy falha.

### Fluxo do problema (confirmado nos dados):

```text
14:26:27 - Keven ENVIA para Matheus
         - GOWS resolve @lid -> 5513991415709@c.us
         - Cria conversa com chat_id=5513991415709@c.us (OK)

14:26:46 - Matheus RESPONDE
         - from=91057635229851@lid (GOWS NAO resolve)
         - chatId = 91057635229851@lid
         - originalLidChatId = null (nao houve resolucao)
         - Tentativa 1: busca chat_id=91057635229851@lid -> NAO encontra
         - Tentativa 2: busca por contato_id -> NAO encontra (contato novo)
         - Tentativa 3: busca fuzzy por %35229851% -> NAO bate com 5513991415709@c.us
         - Tentativa 4: originalLidChatId=null -> PULA (nao se aplica)
         - Tentativa 4b: RPC resolve_lid_conversa('91057635229851')
           -> Retorna conversa 4a99022b (A PROPRIA @lid criada neste mesmo fluxo)
           -> Bug: deveria retornar a conversa @c.us, mas encontra a @lid primeiro
         - CRIA nova conversa duplicada com chat_id=91057635229851@lid
```

## Solucao

### Mudanca 1: Corrigir RPC `resolve_lid_conversa`

Adicionar filtro para excluir conversas cujo `chat_id` contem `@lid`. A RPC deve retornar APENAS conversas com `chat_id @c.us` que tenham referencia ao numero @lid no `raw_data`.

```sql
-- Adicionar: AND c.chat_id NOT LIKE '%@lid'
```

### Mudanca 2: Adicionar Tentativa 5 - busca reversa por raw_data

Quando chatId e @lid e nenhuma tentativa anterior funcionou, buscar diretamente nas mensagens de OUTRAS conversas (nao @lid) que contenham referencia ao @lid number no raw_data. Isso e mais robusto que a RPC.

### Mudanca 3: Tentativa 3 aprimorada com busca por contato_id cross-session

Se chatId e @lid, buscar conversa pelo contato_id encontrado (mesmo que de outra sessao), ja que o contato pode ter sido criado com telefone real via uma mensagem anterior.

### Mudanca 4: Limpeza SQL dos dados

Merge das conversas duplicadas existentes em ambas as organizacoes (Litoral Place e Personal Junior):
- Mover mensagens de conversas @lid para as conversas @c.us correspondentes
- Soft-delete das conversas @lid duplicadas
- Atualizar telefones dos contatos @lid para o numero real

## Detalhes Tecnicos

### Arquivo: Migracao SQL (RPC)

Recriar a funcao `resolve_lid_conversa` com filtro `c.chat_id NOT LIKE '%@lid'`:

```sql
CREATE OR REPLACE FUNCTION public.resolve_lid_conversa(p_org_id uuid, p_lid_number text)
RETURNS TABLE(conversa_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT m.conversa_id
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE m.organizacao_id = p_org_id
    AND m.raw_data::text LIKE '%' || p_lid_number || '%'
    AND c.deletado_em IS NULL
    AND c.chat_id NOT LIKE '%@lid'  -- EXCLUIR conversas @lid
  LIMIT 1;
$$;
```

### Arquivo: `supabase/functions/waha-webhook/index.ts`

1. **Tentativa 4b**: Adicionar validacao para ignorar resultado se a conversa retornada tem `chat_id @lid` (mesmo que a RPC retorne)

2. **Tentativa 5** (nova): Quando Tentativa 4b falha, buscar conversa @c.us por contato_id na mesma org (sem filtro de sessao):

```typescript
// Tentativa 5: buscar conversa @c.us pelo mesmo contato_id
if (!existingConversa && chatId.includes("@lid") && contatoId) {
  const { data: conversaCus } = await supabaseAdmin
    .from("conversas")
    .select("id, total_mensagens, mensagens_nao_lidas, chat_id, contato_id")
    .eq("organizacao_id", sessao.organizacao_id)
    .eq("contato_id", contatoId)
    .eq("tipo", "individual")
    .not("chat_id", "like", "%@lid")
    .is("deletado_em", null)
    .maybeSingle();

  if (conversaCus) {
    existingConversa = conversaCus;
    chatId = conversaCus.chat_id;
  }
}
```

3. **Protecao final**: Antes de criar conversa nova, se chatId ainda e @lid, fazer uma ultima busca direta no raw_data das mensagens existentes para extrair o numero @c.us real

### Arquivo: Migracao SQL (limpeza de dados)

Para Litoral Place (`0f93da3e`):
- Merge `91057635229851@lid` + `5513991415709@c.us` (Matheus da Costa)
- Merge `98079957098744@lid` (MT) com sua conversa @c.us se existir

Para Personal Junior (`1a3e19c7`):
- Todas as 20 conversas @lid restantes: verificar se tem @c.us correspondente e fazer merge

## Resultado Esperado

- A RPC nunca mais retorna a propria conversa @lid como resultado
- Quando um @lid chega sem resolucao, o sistema encontra a conversa @c.us pelo contato ou pelo raw_data
- Conversas @lid existentes sao automaticamente migradas para @c.us na proxima mensagem
- Duplicidade eliminada definitivamente
