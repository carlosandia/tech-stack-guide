

# Plano: Correção de Duplicidade de Conversas e Nomes Corrompidos

## Diagnóstico da Raiz do Problema

A "duplicidade" visível nas conversas tem **duas causas distintas**:

### Causa 1: Nomes Corrompidos (principal causa visual)
O bug anterior do `pushName` (corrigido no ultimo deploy) fez com que o nome do proprio usuario do WhatsApp ("Keven Litoral Place") fosse gravado em **muitos contatos diferentes**. Resultado: 10+ conversas de pessoas diferentes aparecem todas com o nome "Keven Litoral Place", dando a impressao de duplicidade.

- 10 contatos com nome "Keven Litoral Place" (todos com telefones diferentes)
- 156 contatos com nome "Comercial Junior Santos" (outra sessao com mesmo bug)

### Causa 2: Sessao Antiga Nao Limpa
Uma conversa antiga (sessao `6e89f3f3`, usuario `9e09faf0`) com `chat_id=5513988506995@c.us` ainda aparece na listagem junto com a conversa nova (sessao `e598bc04`), pois a listagem filtra apenas por `organizacao_id`, nao por sessao.

## Solucoes

### 1. Migração SQL: Resetar Nomes Corrompidos
Atualizar todos os contatos que tiveram o nome sobrescrito para o numero de telefone. O nome real sera restaurado automaticamente na proxima mensagem recebida de cada contato (o webhook ja esta corrigido).

```sql
-- Resetar "Keven Litoral Place" para telefone
UPDATE contatos SET nome = telefone, atualizado_em = now()
WHERE nome = 'Keven Litoral Place' AND deletado_em IS NULL
AND telefone != '5513974109032'; -- Manter o contato que realmente é o Keven

-- Resetar "Comercial Junior Santos" para telefone  
UPDATE contatos SET nome = telefone, atualizado_em = now()
WHERE nome = 'Comercial Junior Santos' AND deletado_em IS NULL;

-- Atualizar nome nas conversas tambem
UPDATE conversas SET nome = ct.telefone
FROM contatos ct WHERE conversas.contato_id = ct.id
AND ct.nome = ct.telefone AND conversas.deletado_em IS NULL;
```

### 2. Limpar Conversas Duplicadas da Sessao Antiga
Soft-delete na conversa antiga que tem o mesmo `chat_id` de uma conversa ativa na sessao atual.

### 3. Prevenção no Webhook: Buscar Conversa Sem Filtro de Sessao
Alterar a logica de busca de conversa existente no `waha-webhook` para, quando nao encontrar pela sessao atual, buscar por `chat_id` + `organizacao_id` sem filtrar por `sessao_whatsapp_id`. Isso evita que uma reconexao (nova sessao) crie conversas duplicadas.

**Arquivo**: `supabase/functions/waha-webhook/index.ts`

Na busca de conversa existente (Tentativa 1, linha ~1511), adicionar uma **Tentativa 1b** que busca pelo `chat_id` sem filtro de sessao. Se encontrar, atualizar o `sessao_whatsapp_id` da conversa para a sessao atual.

### 4. Prevenção no Webhook: Nao Criar Contato Duplicado por Nome
O contato ja e buscado por telefone (fuzzy match), entao essa parte ja esta correta. O problema era apenas a sobrescrita do nome.

## Resumo dos Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/waha-webhook/index.ts` | Busca de conversa sem filtro de sessao (prevencao futura) |
| Nova migracao SQL | Resetar nomes corrompidos + limpar conversa duplicada |

## Resultado Esperado

- Contatos voltam a mostrar numeros de telefone (temporariamente) ate receberem mensagem
- Cada pessoa aparece apenas UMA vez na lista de conversas
- Reconexoes futuras nao criarao conversas duplicadas

