
## Correcao: Abrir midia real do Status via WAHA API (nao o thumbnail)

### Problema
Quando clica na previa de resposta a Status, o sistema abre o thumbnail base64 (imagem pequena e pixelada) ao inves de buscar a midia real via API WAHA. Isso acontece porque o codigo atual tem um guard que pula a chamada de API para mensagens sinteticas (`quoted.id?.startsWith('synthetic_')`), caindo direto no fallback do thumbnail.

### Causa Raiz
No `ChatMessageBubble.tsx`, linha 740, a condicao:
```text
if (!quoted.conversa_id || !quoted.message_id || quoted.id?.startsWith('synthetic_'))
```
Impede que mensagens sinteticas (Status) tentem buscar a midia real. Porem, a mensagem sintetica ja possui `message_id` = stanzaId (ID real do WAHA) e `conversa_id` valido -- tudo que e necessario para a chamada funcionar.

### Solucao
Remover a verificacao `quoted.id?.startsWith('synthetic_')` do guard. Assim, mensagens sinteticas com `conversa_id` e `message_id` validos irao tentar a API WAHA primeiro, usando `status@broadcast` como `chat_id`. Se a API falhar (status expirado), o fallback para o thumbnail continua funcionando normalmente.

### Arquivo Alterado
- `src/modules/conversas/components/ChatMessageBubble.tsx` (1 linha alterada)

### Detalhe Tecnico
A condicao na linha 740 sera simplificada de:
```text
if (!quoted.conversa_id || !quoted.message_id || quoted.id?.startsWith('synthetic_'))
```
para:
```text
if (!quoted.conversa_id || !quoted.message_id)
```
Isso permite que o fluxo prossiga para a chamada `conversasApi.downloadMessageMedia()` que ja esta implementada e funcional no waha-proxy.
