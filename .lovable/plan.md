
# Correcao: Contagem de votos duplicada + UI de votos estilo WhatsApp

## Problema 1: Votos contados a mais

**Causa raiz**: No webhook `poll.vote` (linha 269), o codigo INCREMENTA votos a cada evento:
```
votes: wasSelected ? (opt.votes || 0) + 1 : opt.votes
```

Porem, o WAHA pode enviar multiplos eventos `poll.vote` para o mesmo votante (ex: ao mudar voto, ao reconectar). Cada evento contem `selectedOptions` com TODAS as opcoes atualmente selecionadas por aquele votante. O correto conforme docs WAHA e SUBSTITUIR, nao incrementar.

**Evidencia**: O log mostra `selectedOptions: ["Sim","Não"]` para o votante `5513988506995@c.us`. O WhatsApp mostra 1 voto em cada, mas o CRM mostra Sim=2, Nao=1 (total 3). Isso indica que o evento poll.vote disparou pelo menos 2 vezes para "Sim".

**Correcao em `supabase/functions/waha-webhook/index.ts`**:

Armazenar as selecoes por votante no campo `raw_data` da mensagem de enquete. Cada poll.vote substitui a selecao daquele votante especifico. Em seguida, recalcular os totais a partir de todos os votantes.

```typescript
// Em vez de incrementar, armazenar por votante e recalcular
const voterId = vote?.from || vote?.id?.split('_')[1] || 'unknown';

// Buscar raw_data existente para obter voters anteriores
const pollVoters = (pollMsg.raw_data?.poll_voters || {}) as Record<string, string[]>;

// SUBSTITUIR selecao deste votante (nao incrementar)
pollVoters[voterId] = selectedOptions;

// Recalcular totais a partir de todos os votantes
const updatedOptions = currentOptions.map(opt => {
  const voteCount = Object.values(pollVoters).filter(
    selections => selections.includes(opt.text)
  ).length;
  return { ...opt, votes: voteCount };
});

// Atualizar mensagem com opcoes recalculadas E raw_data com voters
await supabaseAdmin.from("mensagens").update({
  poll_options: updatedOptions,
  raw_data: { ...(pollMsg.raw_data || {}), poll_voters: pollVoters },
  atualizado_em: new Date().toISOString(),
}).eq("id", pollMsg.id);
```

Tambem atualizar o SELECT para incluir `raw_data`:
```
.select("id, poll_options, message_id, raw_data")
```

---

## Problema 2: UI de "Mostrar votos" diferente do WhatsApp

**Referencia**: Na imagem do WhatsApp, ao clicar "Mostrar votos":
- Titulo da enquete no topo (card separado)
- Cada opcao como card com: nome em negrito, contagem de votos, lista de votantes com avatar e horario

**Correcao em `ChatMessageBubble.tsx`** (componente `PollContent`):

Redesenhar a area expandida de votos quando `showVoters = true`. Em vez de apenas mostrar numeros, exibir estilo WhatsApp:

- Card com o titulo da enquete no topo
- Para cada opcao: card com nome em negrito, "X voto(s)" a direita, e abaixo uma lista dos votantes (usando dados de `poll_voters` do `raw_data` quando disponivel)
- Usar cores do design system: `bg-muted/50` para cards, `text-foreground` para titulos, `text-muted-foreground` para detalhes

Como os dados de votantes ficam no `raw_data.poll_voters` da mensagem, o componente tera acesso a quem votou em cada opcao.

---

## Arquivos Modificados

1. **`supabase/functions/waha-webhook/index.ts`** - Logica de votos: substituir em vez de incrementar, armazenar por votante em raw_data
2. **`src/modules/conversas/components/ChatMessageBubble.tsx`** - Redesenhar UI de "Mostrar votos" estilo WhatsApp com cards por opcao e lista de votantes

## Correcao de dados existentes

A enquete "Eai" que esta com votos errados sera corrigida automaticamente no proximo evento poll.vote (pois o novo sistema SUBSTITUI). Se necessario, o usuario pode clicar "Refresh" para forcar recalculo.
