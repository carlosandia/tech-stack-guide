

# Correcao: Votos de Enquete nao atualizam na UI em tempo real

## Diagnostico

O webhook `poll.vote` **funciona corretamente** - o voto "Sim" foi recebido e salvo no banco (confirmado nos logs). O Realtime tambem dispara a invalidacao do cache ao detectar UPDATE na tabela `mensagens`.

O problema esta no componente `PollContent` em `ChatMessageBubble.tsx`:

```text
const [options, setOptions] = useState(mensagem.poll_options)
```

`useState` so usa o valor inicial na **primeira montagem**. Quando o React Query invalida o cache e re-renderiza com novos dados, o `mensagem.poll_options` ja tem os votos atualizados, mas o `useState` **ignora** porque ja foi inicializado.

## Solucao

### 1. `ChatMessageBubble.tsx` - Sincronizar estado local com props

Adicionar um `useEffect` para sincronizar quando `mensagem.poll_options` mudar:

```typescript
const [options, setOptions] = useState(mensagem.poll_options)

// Sincronizar quando dados chegarem via Realtime/cache invalidation
useEffect(() => {
  setOptions(mensagem.poll_options)
}, [mensagem.poll_options])
```

Isso garante que quando o webhook atualiza o banco, o Realtime dispara invalidacao, React Query refaz o fetch, e o componente recebe as novas props - o `useEffect` atualiza o estado local.

### 2. Remover necessidade do botao "Mostrar votos" para atualizar

O botao "Mostrar votos" continuara funcionando como fallback (busca do banco via waha-proxy), mas agora sera desnecessario na maioria dos casos, pois os votos chegarao automaticamente via Realtime.

## Arquivo Modificado

- `src/modules/conversas/components/ChatMessageBubble.tsx` - Adicionar `useEffect` para sync de `poll_options`

## Impacto

- Votos de enquete aparecerao **automaticamente** na UI sem necessidade de clicar em nada
- O botao de refresh continua como fallback manual
- Nenhuma mudanca no backend necessaria

