
## Plano: Unificar Status, Corrigir Metricas de Tempo de Resposta

### Problema 1: Duplicidade "Finalizar conversa" vs "Fechada"

No menu do `ChatHeader.tsx`, existem dois caminhos para a mesma acao:
- O item "Fechada" na secao "Alterar Status" (linha 96-108)
- O botao separado "Finalizar conversa" (linha 130-138)

Ambos chamam `onAlterarStatus('fechada')`. Isso confunde o usuario.

**Solucao**: Remover o botao separado "Finalizar conversa" e manter apenas o item "Fechada" na lista de status. Isso reduz cliques e elimina a confusao.

**Arquivo**: `src/modules/conversas/components/ChatHeader.tsx`
- Remover o bloco condicional `{conversa.status !== 'fechada' && (...)}` (linhas 130-138)
- Remover o `<div>` separador acima dele (linha 128)
- Remover import nao utilizado `CheckCircle2`

---

### Problema 2: Logica do Tempo Medio de Resposta (individual e geral)

Existem dois calculos de TMA duplicados com logica ligeiramente diferente:

| Local | Calculo |
|-------|---------|
| `ContatoDrawer.tsx` (HistoricoInteracoes) | Usa milissegundos, divide por 60000, arredonda com `Math.round` |
| `useConversasMetricas.ts` (geral) | Usa `differenceInMinutes` do date-fns que trunca (nao arredonda) |

**Problema com `differenceInMinutes`**: Se o usuario respondeu em 45 segundos, `differenceInMinutes` retorna 0. Respostas rapidas sao ignoradas, inflando a media.

**Solucao**: Unificar a logica usando milissegundos em ambos os locais para maior precisao.

**Arquivo**: `src/modules/conversas/hooks/useConversasMetricas.ts`
- Substituir `differenceInMinutes` por calculo em ms (`(dateB - dateA) / 60000`) para TMR e TMA
- Isso captura respostas menores que 1 minuto corretamente

**Arquivo**: `src/modules/conversas/components/ContatoDrawer.tsx`
- A logica atual usando ms ja esta correta, nenhuma alteracao necessaria

---

### Problema 3: Historico de Interacoes carrega automaticamente

O `HistoricoInteracoes` ja usa `useQuery` que carrega automaticamente ao abrir o drawer. Nao precisa de clique extra. Isso ja esta correto.

---

### Resumo de alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `ChatHeader.tsx` | Remover "Finalizar conversa" duplicado e separador desnecessario |
| `useConversasMetricas.ts` | Trocar `differenceInMinutes` por calculo em ms para precisao |
