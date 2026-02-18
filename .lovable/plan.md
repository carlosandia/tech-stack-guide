
# Botão "Conversar" no vCard: abrir modal Nova Conversa com telefone preenchido

## Contexto

Atualmente, o botão "Conversar" dentro de um cartão de contato (vCard) no chat abre o `wa.me` no navegador. O comportamento desejado é abrir o modal "Nova Conversa" com o telefone do contato ja preenchido.

## Alteracoes

### 1. NovaConversaModal - aceitar telefone inicial via props

Adicionar prop opcional `telefoneInicial` ao componente. Quando presente, o modal abre ja no modo "telefone" com o numero preenchido e o pais detectado automaticamente.

**Arquivo**: `src/modules/conversas/components/NovaConversaModal.tsx`

- Adicionar `telefoneInicial?: string` na interface `NovaConversaModalProps`
- No `useEffect` de reset (quando `isOpen` muda), se `telefoneInicial` existir:
  - Detectar o DDI do numero (ex: se comeca com "55", selecionar Brasil)
  - Remover o DDI e colocar o restante no campo `telefone`
  - Manter modo "telefone"

### 2. ConversasPage - gerenciar estado do telefone inicial

**Arquivo**: `src/modules/conversas/pages/ConversasPage.tsx`

- Adicionar estado `novaConversaTelefone` (string | null)
- Criar callback `handleIniciarConversaComTelefone(telefone: string)` que seta o telefone e abre o modal
- Passar `telefoneInicial` para o `NovaConversaModal`
- Limpar `novaConversaTelefone` ao fechar o modal
- Passar o callback para o `ChatWindow`

### 3. ChatWindow - propagar callback ate o ChatMessageBubble

**Arquivo**: `src/modules/conversas/components/ChatWindow.tsx`

- Receber e repassar prop `onStartConversation` para `ChatMessages`

### 4. ChatMessages - repassar para ChatMessageBubble

**Arquivo**: `src/modules/conversas/components/ChatMessages.tsx`

- Receber e repassar prop `onStartConversation` para `ChatMessageBubble`

### 5. ChatMessageBubble - alterar botao "Conversar" no vCard

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

- Receber prop `onStartConversation?: (telefone: string) => void`
- No botao "Conversar" do `VCardContent` (linha 440-443), ao inves de abrir `wa.me`, chamar `onStartConversation` com o telefone limpo
- Fallback: se `onStartConversation` nao estiver disponivel, manter comportamento atual (abrir wa.me)
