

# Ajuste de clique no card de Solicitações

## Objetivo

Tornar todo o card clicável para abrir o modal de detalhes, exceto o botão de contagem de mensagens do WhatsApp (ex: "3 msg") que deve continuar abrindo o chat.

## Alteração

### Arquivo: `src/modules/negocios/components/kanban/SolicitacaoCard.tsx`

Envolver todo o card em um único `onClick` que chama `onClick(preOp)` (abrir modal), e manter apenas o botão do WhatsApp com `stopPropagation` chamando `onWhatsApp`.

Mudanças específicas:

1. Mover o `onClick={() => onClick(preOp)}` para o `div` raiz do card (o container principal)
2. Remover os botões/divs internos redundantes que também chamam `onClick`
3. Manter o `stopPropagation` no botão do WhatsApp ("X msg") para que ele continue abrindo o chat
4. Adicionar `cursor-pointer` ao card raiz

Resultado: clicar em qualquer lugar do card (nome, telefone, mensagem, tempo de espera) abre o modal. Apenas clicar no ícone WhatsApp + "X msg" abre o chat.

