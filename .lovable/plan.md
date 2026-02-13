
# Correção: Sincronização completa de mensagens do dispositivo WhatsApp para o CRM

## Diagnóstico Completo

Ao analisar os logs do webhook e o banco de dados, identifiquei **3 problemas encadeados** que causam a perda de mensagens enviadas pelo celular (texto, áudio, foto, vídeo, documento, contato, enquete):

### Problema 1: Resolução @lid parcialmente funcional
O WAHA GOWS usa Linked IDs (@lid) internos em vez de números de telefone (@c.us). O código atual tenta resolver via `_data.key.remoteJidAlt`, mas falha em alguns cenários (payload sem esse campo, timing, etc.), resultando em `chatId = 162826672971943@lid` em vez de `5513988506995@c.us`.

**Log real:**
```
fromMe individual: from=162826672971943@lid, to=162826672971943@lid, chatId=162826672971943@lid
```

### Problema 2: Constraint `contatos_status_check` rejeita `pre_lead`
O código insere contatos com `status: "pre_lead"`, mas a constraint no banco só aceita: `novo`, `lead`, `mql`, `sql`, `cliente`, `perdido`. Resultado: **erro fatal que aborta o processamento**.

**Log real:**
```
Error creating contato: new row for relation "contatos" violates check constraint "contatos_status_check"
```

### Problema 3: Conversa não encontrada com chatId @lid
Mesmo que a resolução @lid funcione parcialmente, se a conversa original foi criada com `5513988506995@c.us`, uma busca por `162826672971943@lid` nunca vai encontrar a conversa existente.

```text
Fluxo atual (FALHA):
1. Webhook recebe mensagem fromMe
2. payload.to = undefined -> toField = rawFrom = "@lid"
3. remoteJidAlt disponível MAS resolução falha em alguns casos
4. chatId = "@lid" (errado)
5. Busca contato com telefone "162826672971943" -> não existe
6. Cria contato com status "pre_lead" -> ERRO: contatos_status_check
7. ABORTA - mensagem perdida para sempre
```

## Solução (3 correções)

### Correção 1: Migração SQL - Adicionar `pre_lead` na constraint
Alterar a constraint `contatos_status_check` para incluir `pre_lead` como status válido.

```sql
ALTER TABLE contatos DROP CONSTRAINT contatos_status_check;
ALTER TABLE contatos ADD CONSTRAINT contatos_status_check 
  CHECK (status IN ('novo', 'lead', 'mql', 'sql', 'cliente', 'perdido', 'pre_lead'));
```

### Correção 2: Resolução @lid robusta com múltiplos fallbacks
No arquivo `supabase/functions/waha-webhook/index.ts`, substituir o bloco de resolução @lid (linhas 492-515) por uma versão com 4 estratégias de fallback:

1. **remoteJidAlt** (campo padrão GOWS) - já existe mas será reforçado
2. **_data.to** - fallback secundário
3. **chat.id** - terceiro fallback
4. **Busca no banco** (NOVO) - busca mensagens anteriores do mesmo LID que já foram resolvidas, extraindo o número real do `raw_data._data.key.remoteJidAlt`

### Correção 3: Fallback na criação de contato
Adicionar try/catch com fallback para `status: "novo"` caso `pre_lead` falhe (proteção extra mesmo após a migração).

### Correção 4: Busca de conversa com fallback por contato
Se a busca por `chatId` (que pode ser @lid) não encontrar conversa, fazer uma busca secundária pelo `contato_id` + `sessao_whatsapp_id` para encontrar a conversa existente.

## Arquivos Alterados

1. **Migração SQL** - Adicionar `pre_lead` à constraint
2. **`supabase/functions/waha-webhook/index.ts`** - Resolução @lid robusta, fallback de contato, fallback de conversa

## Resultado Esperado

Após as correções, TODAS as mensagens enviadas pelo dispositivo WhatsApp (texto, áudio, foto, vídeo, documento, contato, enquete) serão sincronizadas imediatamente no CRM via webhook, independentemente de o WAHA GOWS usar @lid ou @c.us.
