
# Correcao: Mencoes em Grupos Exibindo Numeros ao Inves de Nomes

## Problema

No WhatsApp, quando alguem menciona um usuario em um grupo (ex: `@Kamilly Vasconcelos`), o CRM exibe o numero bruto (ex: `@224953207095378`) ao inves do nome da pessoa mencionada.

**Causa raiz**: O WAHA NOWEB envia o `body` da mensagem com o numero/LID no lugar da mencao (ex: `@224953207095378`), mas inclui os dados dos mencionados no campo `_data.message.extendedTextMessage.contextInfo.mentionedJid` (array de JIDs). O sistema atualmente:

1. Salva o `body` cru sem processar mencoes
2. Nao extrai nem armazena os JIDs mencionados
3. O frontend renderiza o texto sem nenhum tratamento de `@numero`

**Por que nao traz o nome diretamente?** O WAHA nao substitui os JIDs por nomes no body -- isso e responsabilidade do cliente. O payload apenas fornece a lista de JIDs mencionados; cabe ao CRM resolver esses JIDs para nomes usando os contatos ja cadastrados ou via API.

**Sobre conversas antigas**: Sim, a ausencia de historico influencia -- se o contato mencionado nunca enviou mensagem nesse tenant, ele nao existe na base de contatos, entao nao temos o nome para substituir. Isso e esperado.

## Solucao em 2 Partes

### Parte 1: Frontend -- Resolver mencoes na renderizacao (ChatMessageBubble)

**Arquivo**: `src/modules/conversas/components/ChatMessageBubble.tsx`

Modificar o componente `TextContent` para detectar padroes `@numero` no body e tentar resolver o nome:

1. Extrair `mentionedJid` do `raw_data` da mensagem (ja armazenado)
2. Para cada `@numero` no texto, buscar o contato correspondente na base (via query ou cache local)
3. Substituir `@numero` por `@Nome` com estilo visual (negrito, cor diferente)

```typescript
// Logica de resolucao de mencoes no TextContent
function resolveMentions(body: string, rawData: any, contatos: Map<string, string>): string {
  // Extrair mentionedJid do contextInfo
  const contextInfo = rawData?.message?.extendedTextMessage?.contextInfo;
  const mentionedJids = contextInfo?.mentionedJid || contextInfo?.mentionedJID || [];
  
  let resolved = body;
  for (const jid of mentionedJids) {
    const number = jid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace("@lid", "");
    const name = contatos.get(number); // buscar do cache/query
    if (name) {
      resolved = resolved.replace(`@${number}`, `@${name}`);
    }
  }
  return resolved;
}
```

**Abordagem para buscar nomes**: Criar um hook `useMentionResolver` que:
- Recebe as mensagens visiveis da conversa
- Extrai todos os numeros mencionados unicos
- Faz uma unica query na tabela `contatos` filtrando por `telefone LIKE %numero` 
- Retorna um Map de `numero -> nome`
- Usa cache (React Query) para nao repetir queries

### Parte 2: Componente visual da mencao

Renderizar mencoes como `<span>` estilizado (similar ao WhatsApp):
- Cor azul/destaque para mencoes
- Texto em negrito
- Se o contato nao existir na base, manter o numero formatado como `@+55 31 99444-4555`

### Nao e necessario alterar o webhook

O `raw_data` ja contem o payload completo do WAHA (incluindo `contextInfo.mentionedJid`). O body salvo e o texto original. A resolucao de nomes e melhor feita no frontend porque:
- Novos contatos podem ser adicionados depois (o nome resolve retroativamente)
- Nao precisa fazer chamadas API no webhook (performance)
- O raw_data ja esta disponivel

## Arquivos a modificar

1. **`src/modules/conversas/components/ChatMessageBubble.tsx`**: Alterar `TextContent` para processar mencoes, extraindo JIDs do `raw_data` e substituindo por nomes
2. **`src/modules/conversas/hooks/useMentionResolver.ts`** (novo): Hook que busca nomes dos contatos mencionados via query Supabase
3. **`src/modules/conversas/components/ChatMessages.tsx`**: Passar dados do resolver para cada `ChatMessageBubble`

## Limitacoes conhecidas

- Se o contato mencionado nunca interagiu com o tenant, o nome nao estara na base -- exibira o numero formatado
- Mencoes em mensagens de midia (imagem com legenda) tambem serao tratadas
