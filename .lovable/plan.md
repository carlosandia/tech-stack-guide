
# Correcoes: Enquete do dispositivo + Icone anexo (+) + Mensagens prontas no popover

## 3 Mudancas

---

### 1. Enquete enviada via dispositivo nao aparece no CRM

**Diagnostico**: A enquete "Eai funfa" FOI recebida pelo webhook e salva no banco, porem como `tipo: "text"` com `body: null` e sem dados de enquete. Motivo:

- O WAHA GOWS envia `payload.type` como `undefined` (o tipo real esta em `_data.Info.Type: "poll"`)
- Os dados da enquete estao em `_data.Message.pollCreationMessageV3.name` e `.options[].optionName`, nao em `_data.pollOptions` como o codigo espera
- Resultado: a mensagem e salva como texto vazio, invisivel no chat

**Correcao em `supabase/functions/waha-webhook/index.ts`**:

Adicionar deteccao de `pollCreationMessage` / `pollCreationMessageV3` na secao de inferencia de tipo (apos linha ~829), similar a deteccao de contatos:

```typescript
// Detect poll messages from device (GOWS engine)
// GOWS sends polls with type undefined, but _data.Message contains pollCreationMessage/V3
if (wahaType === "text" || wahaType === "chat") {
  const msg = payload._data?.Message || payload._data?.message || {};
  if (msg.pollCreationMessageV3 || msg.pollCreationMessage) {
    wahaType = "poll";
    const pollMsg = msg.pollCreationMessageV3 || msg.pollCreationMessage;
    // Store for later extraction
    payload.__detectedPollData = pollMsg;
  }
}

// Also check _data.Info.Type as fallback
if ((wahaType === "text" || wahaType === "chat") && payload._data?.Info?.Type === "poll") {
  wahaType = "poll";
}
```

Atualizar a secao de extracao de dados de enquete (linhas 1011-1018) para tambem buscar de `pollCreationMessageV3`:

```typescript
if (wahaType === "poll" || wahaType === "poll_creation") {
  messageInsert.tipo = "poll";
  
  // Source 1: _data.pollOptions (NOWEB engine)
  // Source 2: pollCreationMessageV3 (GOWS engine - from device)
  const detectedPoll = payload.__detectedPollData;
  const gowsPollMsg = payload._data?.Message?.pollCreationMessageV3 
    || payload._data?.Message?.pollCreationMessage
    || payload._data?.message?.pollCreationMessageV3
    || payload._data?.message?.pollCreationMessage;
  const pollSource = detectedPoll || gowsPollMsg;
  
  messageInsert.poll_question = payload._data?.pollName 
    || pollSource?.name 
    || payload.body 
    || null;
  
  const pollOpts = payload._data?.pollOptions;
  if (Array.isArray(pollOpts)) {
    messageInsert.poll_options = pollOpts.map(opt => ({ text: opt.name || "", votes: 0 }));
  } else if (pollSource?.options && Array.isArray(pollSource.options)) {
    messageInsert.poll_options = pollSource.options.map(opt => ({ 
      text: opt.optionName || opt.name || "", votes: 0 
    }));
  }
  
  // Set body with poll emoji prefix if missing
  if (!messageInsert.body && messageInsert.poll_question) {
    messageInsert.body = `📊 ${messageInsert.poll_question}`;
  }
}
```

---

### 2. Icone de clipe (Paperclip) vira "+" (Plus)

**Correcao em `src/modules/conversas/components/ChatInput.tsx`**:

- Trocar import de `Paperclip` por `Plus` do lucide-react
- Substituir `<Paperclip>` por `<Plus>` no botao de anexos

---

### 3. Botao de mensagens prontas (Zap) vai para dentro do popover de anexos

**Correcao em `src/modules/conversas/components/ChatInput.tsx`**:

- Remover o botao standalone do `<Zap>` (linhas 224-231)
- O botao de mensagens prontas sera acionado de dentro do AnexosMenu

**Correcao em `src/modules/conversas/components/AnexosMenu.tsx`**:

- Adicionar nova opcao "Mensagens Prontas" com icone `Zap` no menu de anexos
- Receber nova prop `onMensagensProntas` e acionar ao clicar

---

## Arquivos Modificados

1. `supabase/functions/waha-webhook/index.ts` - Deteccao de poll GOWS + extracao de dados
2. `src/modules/conversas/components/ChatInput.tsx` - Paperclip para Plus, remover Zap standalone
3. `src/modules/conversas/components/AnexosMenu.tsx` - Adicionar opcao Mensagens Prontas
