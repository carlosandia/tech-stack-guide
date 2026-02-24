
## Correção: Tela "Nova versão disponível" aparecendo ao navegar entre módulos

### Problema Raiz

Existem **dois mecanismos de retry para chunk errors** que conflitam entre si:

1. **`lazyWithRetry`** — detecta falha de import dinâmico, faz reload com `?_cb=timestamp`, usa chave `chunk-reload-{nome}`
2. **`ErrorBoundary`** — detecta o mesmo erro no `componentDidCatch`, faz reload com `?_cb=timestamp`, usa chave diferente `eb-chunk-reload`

Quando um chunk falha (ex: após deploy, o browser tem referência a chunk antigo):
1. `lazyWithRetry` recarrega a página (1o reload)
2. Se ainda falha, `lazyWithRetry` propaga o erro para o `ErrorBoundary`
3. `ErrorBoundary` recarrega novamente (2o reload) — usando SUA chave separada
4. Se ainda falha, `lazyWithRetry` recarrega DE NOVO (chave dele foi limpa no passo 2)
5. Na 4a tentativa, ambas as chaves estão esgotadas e a tela "Nova versão disponível" aparece

O problema é que **2 reloads nunca são suficientes** se os chunks realmente não existem no servidor (ex: deploy novo pendente de publicação, ou CDN com cache antigo).

### Solução

#### 1. `ErrorBoundary.tsx` — Remover o retry duplicado de chunk errors

O `componentDidCatch` NÃO deve mais tentar recarregar para chunk errors. O `lazyWithRetry` já faz isso. Quando o erro chega ao ErrorBoundary, significa que o retry do `lazyWithRetry` já falhou — então o ErrorBoundary deve apenas exibir o fallback.

Além disso, quando for chunk error e o botão "Atualizar agora" for clicado, fazer um **hard reload** que limpa todo cache: navegar para a URL raiz sem parâmetros e limpar todas as chaves de chunk do sessionStorage.

#### 2. `lazyWithRetry.ts` — Remover check genérico `failed to fetch`

A condição `msg.includes('failed to fetch')` é muito ampla — pode capturar erros de rede genéricos (não relacionados a chunks) e disparar reloads desnecessários. Manter apenas as condições específicas de chunk.

### Arquivos modificados

- **`src/components/ErrorBoundary.tsx`** — Remover auto-reload de chunk errors do `componentDidCatch`; melhorar o `handleReload` para limpar sessionStorage de chunks e fazer hard reload
- **`src/utils/lazyWithRetry.ts`** — Remover `failed to fetch` genérico da detecção de chunk errors
