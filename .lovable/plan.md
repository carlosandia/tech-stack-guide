
# Correção: Resolução @lid na automação de etiquetas

## Problema Identificado

Os logs mostram que o webhook `label.chat.added` **encontra** a conversa, mas encontra a **errada**:

- Webhook recebe: `chatId: 162826672971943@lid`
- Encontra conversa `0307d2f8` (chat_id = `162826672971943@lid`) com contato duplicado (telefone = `162826672971943@lid`)
- A oportunidade real do "Carlos Andia" esta vinculada ao contato `3883977c` (telefone = `5513988506995`) na conversa `2dfd0edc` (chat_id = `5513988506995@c.us`)
- Resultado: a automacao nao encontra oportunidade no contato errado e falha silenciosamente

## Causa Raiz

Existe uma conversa duplicada no formato `@lid` no banco. O match exato (`eq chat_id`) encontra essa conversa antes das estrategias de fallback terem chance de rodar.

## Solucao

Modificar a logica de resolucao no handler `label.chat.added` para:

1. Quando encontrar uma conversa com `chat_id` terminando em `@lid`, verificar se o contato vinculado tem telefone real (formato numerico ou `@c.us`)
2. Se o contato tem telefone `@lid` (contato duplicado), buscar o contato real pelo nome ou por mensagens cruzadas
3. Usar o **contato da conversa `@c.us`** para a automacao de etiquetas, ignorando o contato fantasma `@lid`

A abordagem mais robusta: quando a conversa encontrada tem `chat_id` terminando em `@lid`, buscar no banco de mensagens o `message_id` que contenha esse LID para encontrar a conversa `@c.us` associada. Isso ja funciona (a query retornou match), mas o problema e que a conversa `@lid` e encontrada primeiro pelo match exato e o fallback nunca roda.

### Alteracao no codigo

No `label.chat.added` handler, apos encontrar a conversa, adicionar uma etapa de **validacao**: se a conversa encontrada tem `chat_id` terminando em `@lid`, verificar se existe uma conversa "irmã" em `@c.us` com o mesmo contato real. Se sim, usar a conversa `@c.us` para a automacao.

Concretamente, a logica sera:

```text
1. Match exato chat_id (ja existe)
2. Se encontrou e chat_id termina em @lid:
   a. Buscar mensagens da mesma conversa com message_id contendo o LID number
   b. Buscar o contato real (telefone sem @lid) via raw_data ou resolve_lid_conversa RPC
   c. Se encontrar conversa @c.us do mesmo contato real, usar essa
3. Na automacao de etiquetas, usar o contato_id da conversa CORRETA
```

Alternativa mais simples e eficaz: na parte da **automacao de etiquetas** (apos linha 656), quando o `contato_id` for encontrado, verificar se esse contato tem telefone `@lid`. Se sim, buscar o contato real cujo telefone e numerico e que tem o mesmo nome, e usar esse contato para buscar oportunidades.

## Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Adicionar resolucao de contato duplicado @lid no bloco de automacao de etiquetas (linhas ~650-715) |

## Detalhes Tecnicos

Na secao de automacao de etiquetas (dentro do `label.chat.added`), apos obter o `contato_id` da conversa (linha 657), adicionar:

```text
Se contato.telefone termina em "@lid":
  1. Extrair lidNumber do telefone
  2. Buscar em mensagens: message_id ILIKE '%{lidNumber}%' em OUTRA conversa
  3. Pegar conversa_id dessa mensagem e buscar contato_id real
  4. Usar esse contato_id para buscar/mover oportunidades
```

Isso garante que mesmo com conversas duplicadas `@lid`, a automacao sempre encontra o contato real com a oportunidade vinculada.
