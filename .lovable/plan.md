
# Correção: Duplicidade de Conversas e Nome de Grupo

## Problema 1: Conversa Duplicada (Carlos Andia / 5513988506995)

A migração anterior deveria ter feito soft-delete na conversa antiga `2dfd0edc` (sessão `6e89f3f3`), mas ela permanece ativa. Resultado: duas conversas para o mesmo chat_id `5513988506995@c.us`.

**Solução**: Executar soft-delete direto na conversa duplicada e também em quaisquer outras conversas duplicadas que ainda existam.

```sql
-- Soft-delete conversas duplicadas (mantendo a mais recente por chat_id)
UPDATE conversas SET deletado_em = now()
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY criado_em DESC) as rn
    FROM conversas WHERE deletado_em IS NULL
  ) sub WHERE rn > 1
);
```

## Problema 2: Nome do Grupo Aparecendo como Número

**Causa raiz**: No componente `ConversaItem.tsx`, linha 99:

```typescript
const nome = conversa.contato?.nome || conversa.contato?.nome_fantasia || conversa.nome || 'Sem nome'
```

Para grupos e canais, o sistema cria um "contato" com o ID numérico do grupo como nome (ex: `123136762761304`). Esse contato é priorizado sobre o `conversa.nome`, que contém o nome real do grupo.

**Solução**: Alterar a logica para que grupos e canais usem SEMPRE `conversa.nome` como prioridade:

```typescript
const nome = (conversa.tipo === 'grupo' || conversa.tipo === 'canal')
  ? (conversa.nome || conversa.contato?.nome || 'Sem nome')
  : (conversa.contato?.nome || conversa.contato?.nome_fantasia || conversa.nome || 'Sem nome')
```

Isso tambem deve ser aplicado no `ChatHeader.tsx` se ele exibir o nome de forma semelhante.

## Arquivos Alterados

| Arquivo | O que muda |
|---------|-----------|
| `src/modules/conversas/components/ConversaItem.tsx` | Priorizar `conversa.nome` para grupos/canais |
| `src/modules/conversas/components/ChatHeader.tsx` | Mesma correção de prioridade de nome |
| Nova migração SQL | Soft-delete das conversas duplicadas remanescentes |

## Resultado

- Carlos Andia aparece em UMA unica conversa
- O grupo "Zero to Hero - Tio Keven Foods!" exibe o nome correto
- Qualquer outra conversa duplicada por chat_id tambem sera limpa
