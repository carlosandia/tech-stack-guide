
# Plano de Correcao - Modulo Conversas (3 Problemas)

## Problema 1: Nome do Canal (Newsletter) nao resolvido

**Diagnostico:** Canais do WhatsApp (`@newsletter`) exibem o ID numerico (ex: `120363181602471460`) ao inves do nome real. O GOWS nao popula `_data.subject` nem `_data.name` para newsletters. O fallback atual usa `/api/contacts/about` que tambem nao funciona para canais.

**Correcao no `supabase/functions/waha-webhook/index.ts`:**
- Adicionar endpoint especifico para newsletters do WAHA: `/api/newsletters/{id}` (disponivel no WAHA Plus).
- Fallback adicional: tentar `/api/channels` ou `/api/contacts?contactId={id}` com o ID do canal.
- Se o GOWS retornar `_data.Info.GroupName` ou `_data.ChannelName`, usar como fonte.
- Guardar o nome resolvido na conversa para nao precisar re-buscar.

---

## Problema 2: Imagens e Videos nao renderizam

**Diagnostico:** As imagens existem no Supabase Storage com URL valida (ex: `chat-media/conversas/.../false_xxx.jpg`), mas exibem texto "Imagem" quebrado na UI. A URL publica do storage esta correta no banco.

**Investigacao e Correcao:**
- Verificar se o bucket `chat-media` esta configurado como **publico** no Supabase (se privado, as URLs nao funcionam sem token).
- No componente `ChatMessageBubble.tsx`, a funcao `ImageContent` ja trata `media_url` corretamente. O problema provavelmente esta no bucket ou no `Content-Type` do upload.
- Adicionar tratamento de erro `onError` na tag `<img>` para exibir fallback visual ao inves de icone quebrado.
- Adicionar o mesmo tratamento no `<video>`.

---

## Problema 3: Conversas duplicadas (Carlos Andia e 5513988506995)

**Diagnostico:** O sistema criou DUAS conversas para a mesma pessoa:
1. `chat_id: 5513988506995@c.us` com contato telefone `5513988506995` (nome: "5513988506995")
2. `chat_id: 162826672971943@lid` com contato telefone `162826672971943` (nome: "Carlos Andia")

O `@lid` nao foi resolvido para `@c.us`, gerando um contato E conversa duplicados. O fallback atual (Tentativa 2 na linha 1434) busca por `contato_id`, mas como o contato tambem foi duplicado (telefone `@lid` diferente), nao encontrou match.

**Correcao no `supabase/functions/waha-webhook/index.ts`:**

### 3a. Melhorar resolucao de @lid para mensagens individuais `fromMe`
- Na secao de mensagens `fromMe` individuais (linha ~1210), quando `toField` contem `@lid`, aplicar as mesmas estrategias GOWS que ja existem para grupos:
  - `_data.Info.Chat` (ja existe parcialmente)
  - `_data.key.remoteJid` (novo)
  - `_data.Info.SenderAlt` / `_data.Info.ChatAlt` (novo para GOWS)

### 3b. Busca de contato por telefone normalizado
- Antes de criar um novo contato, alem de buscar por `telefone = phoneNumber`, tambem buscar contatos cujo telefone contenha os ultimos 8-10 digitos do numero (para capturar @lid numerico vs @c.us numerico que representam a mesma pessoa).

### 3c. Busca de conversa com fallback por telefone do contato
- Quando `chatId` contem `@lid` e nao encontra conversa exata, buscar conversas existentes do tipo `individual` na mesma sessao onde o contato associado tenha o mesmo numero de telefone (parcial match).

### 3d. Script de limpeza (manual)
- Fornecer query SQL para o desenvolvedor mesclar as conversas duplicadas (mover mensagens da conversa @lid para a conversa @c.us e deletar a duplicada).

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`supabase/functions/waha-webhook/index.ts`**
   - Secao CHANNEL (linhas ~975-1023): Adicionar endpoint `/api/newsletters/{chatId}` para resolver nome do canal
   - Secao individual fromMe (linhas ~1200-1300): Melhorar resolucao @lid com mais estrategias GOWS
   - Secao STEP 1 contato (linhas ~1343-1410): Adicionar busca fuzzy por telefone (ultimos digitos)
   - Secao STEP 2 conversa (linhas ~1412-1517): Adicionar fallback de busca por telefone do contato

2. **`src/modules/conversas/components/ChatMessageBubble.tsx`**
   - `ImageContent` (linha ~107): Adicionar `onError` handler na `<img>` para exibir fallback
   - `VideoContent` (linha ~131): Adicionar `onError` handler no `<video>`
   - Ambos: Tentar URL com token se a URL publica falhar

3. **Verificacao do bucket `chat-media`**: Confirmar que esta publico no Supabase dashboard.

### Ordem de execucao:
1. Corrigir renderizacao de imagens/videos (frontend)
2. Corrigir resolucao de nome do canal (edge function)
3. Corrigir deduplicacao de conversas por @lid (edge function)
4. Deploy da edge function
