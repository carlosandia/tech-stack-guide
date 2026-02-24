

## Plano: Corrigir Scroll do Chat ao Abrir Conversa

### O Problema

Quando voce clica em uma conversa na sidebar, o chat abre com o scroll em posicao aleatoria ao inves de mostrar a ultima mensagem.

### Causa

O componente `ChatMessages.tsx` usa um `prevLengthRef` para decidir quando fazer scroll para o final. Esse ref guarda o numero de mensagens da conversa **anterior** e nao e resetado ao trocar de conversa. Se a nova conversa tiver menos mensagens, o scroll nao acontece.

### Solucao

Adicionar um `useEffect` que reseta o `prevLengthRef` para `0` quando o `conversaId` muda. Isso faz com que, ao abrir qualquer conversa, o sistema trate como "primeira carga" e execute `scrollIntoView({ behavior: 'instant' })` automaticamente.

### Alteracao

**Arquivo**: `src/modules/conversas/components/ChatMessages.tsx`

Adicionar um `useEffect` simples (3 linhas) logo apos a declaracao do `prevLengthRef`:

```text
useEffect(() => {
  prevLengthRef.current = 0
}, [conversaId])
```

Isso faz com que toda vez que `conversaId` mudar:
1. `prevLengthRef` volta para `0`
2. Quando as mensagens carregam, `mensagens.length > 0` e verdadeiro
3. A condicao `prevLengthRef.current === 0` ativa o scroll instantaneo para o final

### Nenhum outro arquivo precisa mudar

O `ChatWindow.tsx` ja passa `conversaId` como prop para `ChatMessages`. A logica de scroll existente (linhas 204-218) ja trata corretamente o caso de "primeira carga" -- so precisa garantir que o ref seja resetado na troca de conversa.

