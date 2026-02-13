

# Correcao: Votos de Enquete + Mensagem Clara sobre Engine NOWEB

## Diagnostico

Os logs confirmam que a sessao WhatsApp esta usando **engine NOWEB**. Com NOWEB:
- A WAHA dispara `poll.vote.failed` (nao `poll.vote`)
- Os `selectedOptions` chegam vazios `[]`
- Isso e uma limitacao real do protocolo - votos sao criptografados ponta-a-ponta

A mensagem "Sem dados de votos disponiveis" esta correta, mas e confusa para o usuario.

## Problemas a corrigir

### 1. Webhook nao foi deployado corretamente
O log mostra formato de log antigo (`messageId=...` ao inves de `pollId=...`), indicando que o ultimo deploy do `waha-webhook` nao refletiu as alteracoes. Precisa redeployar.

### 2. Mensagem de erro pouco informativa na UI
Quando o engine e NOWEB, mostrar uma mensagem clara explicando que precisa trocar para GOWS/WEBJS, ao inves de apenas "Sem dados de votos disponiveis".

### 3. Tratar `poll.vote.failed` corretamente no webhook
Quando o evento e `poll.vote.failed`, nao tentar processar como voto valido. Registrar o fato e retornar sem erro.

## Alteracoes

### Arquivo: `supabase/functions/waha-webhook/index.ts`
- Separar tratamento de `poll.vote` (sucesso) de `poll.vote.failed` (falha)
- Quando `poll.vote.failed`, logar e retornar sem tentar atualizar votos

### Arquivo: `src/modules/conversas/components/ChatMessageBubble.tsx`
- Quando `engine_limitation` for true, mostrar mensagem especifica:
  "Votos nao disponiveis com engine NOWEB. Troque para GOWS nas configuracoes para habilitar."
- Quando houver 0 votos sem limitacao, mostrar normalmente "0 votos"
- Esconder o botao "Mostrar votos" quando engine for NOWEB (nao tem sentido clicar)

### Arquivo: `supabase/functions/waha-proxy/index.ts`
- Retornar o nome do engine na resposta para a UI poder exibir
- Quando NOWEB, retornar `engine_limitation: true` com mensagem descritiva

### Redeploy
- Forcar redeploy de `waha-webhook` e `waha-proxy`

## Detalhes Tecnicos

### Webhook - separar poll.vote de poll.vote.failed:
```text
if (body.event === "poll.vote") {
  // Processar voto normalmente (GOWS/WEBJS)
  // Buscar mensagem por poll.id, atualizar poll_options
}

if (body.event === "poll.vote.failed") {
  // NOWEB - votos criptografados
  // Apenas logar e retornar sem erro
  return { ok: true, message: "Poll vote failed (NOWEB limitation)" }
}
```

### UI - mensagem clara no PollContent:
```text
Quando engine_limitation === true:
  Mostrar banner: "Votos nao disponiveis com engine NOWEB"
  Subtexto: "Troque para GOWS nas configuracoes de WhatsApp"
  Esconder botao "Mostrar votos"

Quando votos normais (GOWS/WEBJS):
  Mostrar contagem normalmente
```

## Arquivos modificados
1. `supabase/functions/waha-webhook/index.ts` - Separar poll.vote/poll.vote.failed
2. `supabase/functions/waha-proxy/index.ts` - Melhorar resposta com info de engine
3. `src/modules/conversas/components/ChatMessageBubble.tsx` - Mensagem informativa na UI

