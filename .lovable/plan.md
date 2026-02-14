
# Correção de 3 Problemas: Popover, Labels e Apagar Mensagem

## Problema 1: Menu de ações fecha ao mover o mouse (popover abre pra cima)

O menu de ações da mensagem (Responder, Copiar, Apagar...) só aparece quando o mouse está sobre a mensagem (`hovered=true`). Quando o menu abre para cima (pouco espaço abaixo), o mouse precisa sair da área da mensagem para alcançar o menu, causando `hovered=false` e desmontando o componente inteiro -- incluindo o menu que está em um portal.

**Correção:** Quando o menu estiver aberto, manter o componente `MessageActionMenu` visível independente do `hovered`. Adicionar um estado `menuOpen` no componente pai que impede o desmonte.

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx`

- Adicionar estado `actionMenuOpen` no `ChatMessageBubble`
- Passar callback `onOpenChange` para `MessageActionMenu`
- Alterar condição de renderização de `hovered && onDeleteMessage` para `(hovered || actionMenuOpen) && onDeleteMessage`

## Problema 2: Etiquetas sumiram (erro de duplicata no upsert)

Os logs mostram claramente o erro:
```
Error inserting label associations: ON CONFLICT DO UPDATE command cannot affect row a second time
```

O chat `162826672971943@lid` e `5513988506995@c.us` resolvem para a MESMA conversa no banco. Isso gera duas linhas com o mesmo par `(conversa_id, label_id)` no array `allNewRows`. O PostgreSQL rejeita o upsert inteiro quando há duplicatas no mesmo batch.

Resultado: o DELETE limpa todas as labels, mas o INSERT falha -- ficando com 0 labels.

**Correção:** Deduplicar o array `allNewRows` antes do upsert, usando um Set com chave composta `conversa_id:label_id`.

**Arquivo:** `supabase/functions/waha-proxy/index.ts`

```typescript
// Antes do upsert, deduplicar
const uniqueKey = new Set<string>();
const dedupedRows = allNewRows.filter(row => {
  const key = `${row.conversa_id}:${row.label_id}`;
  if (uniqueKey.has(key)) return false;
  uniqueKey.add(key);
  return true;
});
// Usar dedupedRows no upsert
```

## Problema 3: "Apagar para todos" sem limite de tempo

O WhatsApp permite "apagar para todos" somente dentro de aproximadamente 60 horas apos o envio. A UI mostra essa opcao sempre que a mensagem for do usuario, sem validar o tempo.

**Correção:** Calcular a diferença entre agora e `mensagem.criado_em`. Se ultrapassar 60 horas, esconder o botao "Apagar para todos".

**Arquivo:** `src/modules/conversas/components/ChatMessageBubble.tsx`

```typescript
// Dentro de MessageActionMenu, calcular se pode apagar para todos
const MAX_DELETE_FOR_ALL_MS = 60 * 60 * 60 * 1000; // ~60 horas
const canDeleteForAll = mensagem.from_me && 
  (Date.now() - new Date(mensagem.criado_em).getTime()) < MAX_DELETE_FOR_ALL_MS;
```

---

## Resumo de Arquivos

| Arquivo | Mudanca |
|---------|---------|
| `src/modules/conversas/components/ChatMessageBubble.tsx` | Corrigir hover/desmonte do menu + limite temporal do "Apagar para todos" |
| `supabase/functions/waha-proxy/index.ts` | Deduplicar rows antes do upsert de labels |

## Ordem de Implementacao

1. Corrigir deduplicacao de labels no waha-proxy (causa raiz das labels sumidas)
2. Deploy da edge function
3. Corrigir popover que fecha ao mover mouse
4. Adicionar limite de tempo no "Apagar para todos"
