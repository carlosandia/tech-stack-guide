

# Corrigir consulta de votos de enquete (falso positivo NOWEB)

## Problema

O botao "Mostrar votos" sempre retorna "Votos de enquete nao disponiveis com engine NOWEB", mesmo que o usuario esteja usando o engine GOWS. Isso acontece porque:

1. A logica no `waha-proxy` trata **qualquer resposta vazia** como "limitacao NOWEB"
2. Se ninguem votou ainda, a resposta tambem vem vazia -- o que e normal, nao e limitacao de engine
3. O sistema nao sabe qual engine esta sendo usado (nao ha coluna `engine` na tabela `sessoes_whatsapp`)

## Solucao

### 1. Consultar o engine real da sessao WAHA antes de decidir

No `waha-proxy/index.ts`, no case `consultar_votos_enquete`:

- Antes de consultar os votos, fazer um GET em `/api/sessions/{sessionId}` para obter informacoes da sessao, incluindo o campo `engine` retornado pela WAHA API
- Usar essa informacao para distinguir entre:
  - **Votos vazios + engine NOWEB** -> mostrar aviso de limitacao
  - **Votos vazios + engine GOWS/WEBJS** -> mostrar "0 votos" normalmente (ninguem votou ainda)
  - **Endpoint retornou erro (404/501)** -> verificar engine para decidir mensagem

### 2. Tratar resposta vazia corretamente

Quando a WAHA retorna uma lista de opcoes sem votantes:
- Se engine = NOWEB: manter o aviso de limitacao (NOWEB realmente nao suporta votos)
- Se engine != NOWEB (GOWS, WEBJS, etc): retornar os votos como 0 normalmente e atualizar o banco

### 3. Melhorar mensagem na UI

No `ChatMessageBubble.tsx`, quando `engine_limitation` for true:
- Mostrar "Votos nao disponiveis com engine NOWEB" (manter como esta)
- Quando os votos vierem como 0 sem limitacao, mostrar normalmente com "0 votos"

## Detalhes Tecnicos

### Arquivo: `supabase/functions/waha-proxy/index.ts`

No case `consultar_votos_enquete` (linhas 825-953):

```text
// Antes de consultar votos, verificar engine da sessao
const sessionInfoResp = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
  headers: { "X-Api-Key": apiKey }
});
const sessionInfo = await sessionInfoResp.json().catch(() => ({}));
const engineName = (sessionInfo?.engine || sessionInfo?.config?.engine || "NOWEB").toUpperCase();

// Ao verificar votos vazios:
if (!hasActualVotes) {
  if (engineName === "NOWEB") {
    // Limitacao real do NOWEB
    return { engine_limitation: true, error: "..." }
  } else {
    // Ninguem votou ainda - retornar 0 votos normalmente
    return { ok: true, poll_options: currentOptions } // todas com votes: 0
  }
}
```

Quando o endpoint retorna erro (status != 200):
- Se engine NOWEB: retornar `engine_limitation: true`
- Se engine GOWS/WEBJS: retornar erro real ao inves de assumir limitacao

### Arquivo: `src/modules/conversas/components/ChatMessageBubble.tsx`

Nenhuma alteracao necessaria -- a UI ja trata `engine_limitation` vs votos normais corretamente.

## Arquivos modificados

1. `supabase/functions/waha-proxy/index.ts` -- Adicionar consulta de engine + logica condicional

