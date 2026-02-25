

## Plano: Corrigir scroll definitivo com MutationObserver

### Causa raiz real

O `setTimeout(80ms)` executa o `scrollIntoView` antes que imagens, vídeos e áudios terminem de carregar. Esses elementos de mídia alteram a altura do container DEPOIS do scroll, fazendo com que a posicao final fique "no meio" ao inves do final.

Conversas somente com texto funcionam bem. Conversas com mídia (audio, imagem, video) ficam com scroll errado.

### Solucao

Usar um **MutationObserver** no container de mensagens para detectar mudancas no DOM (novas mensagens, midia carregando) e re-scrollar automaticamente durante um curto periodo apos a troca de conversa. Combinado com um **ResizeObserver** para detectar quando imagens/audios terminam de carregar e alteram a altura.

### Alteracao

**Arquivo**: `src/modules/conversas/components/ChatMessages.tsx`

1. Manter o `useEffect` unificado existente (funciona para o disparo inicial)

2. Adicionar um novo `useEffect` com **ResizeObserver** no container:
   - Quando a conversa muda, ativar um flag `shouldAutoScroll` por 2 segundos
   - Durante esse periodo, qualquer mudanca de tamanho no container (causada por midia carregando) forca scroll para o final
   - Apos 2 segundos, desativar o auto-scroll para nao interferir na navegacao normal

```text
Logica simplificada:

[Clica na conversa]
      |
      v
[useEffect detecta conversaMudou]
      |
      v
[Ativa shouldAutoScroll = true por 2s]
      |
      v
[ResizeObserver monitora o container]
      |
      +--> [Altura mudou?] --> [shouldAutoScroll?] --> scrollIntoView
      |
      v (apos 2s)
[Desativa shouldAutoScroll]
```

### Detalhes tecnicos

- `shouldAutoScrollRef` (useRef boolean): flag que indica se deve auto-scrollar
- `ResizeObserver` no container: detecta mudancas de altura (midia carregando)
- Timer de 2 segundos: periodo de "protecao" apos trocar de conversa
- Nao usa MutationObserver (ResizeObserver e suficiente e mais performatico)
- O efeito existente continua fazendo o scroll inicial

### Arquivo

| Arquivo | Acao |
|---------|------|
| `src/modules/conversas/components/ChatMessages.tsx` | Editar -- adicionar ResizeObserver para re-scroll apos midia carregar |

Nenhum outro arquivo precisa ser alterado.

