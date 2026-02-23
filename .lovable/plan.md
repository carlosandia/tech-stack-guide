
# Corrigir erro de chunks 404 apos deploy (dynamic import failure)

## Problema

Quando o usuario faz login apos um novo deploy, o browser carrega o `index.html` antigo (cacheado) que referencia chunks JS com hashes desatualizados (ex: `FormulariosPage-BYNHweCo.js`). Esses arquivos nao existem mais no servidor, causando 404 e o ErrorBoundary exibe "Algo deu errado".

Isso acontece porque:
1. O Vite gera nomes de arquivo com hash por build
2. O browser cacheia o HTML principal
3. Apos deploy, os chunks antigos sao removidos
4. O `React.lazy()` falha ao importar modulos que nao existem mais

## Solucao

### 1. Criar helper `lazyWithRetry` em `src/utils/lazyWithRetry.ts`

Funcao wrapper que:
- Tenta o import dinamico normalmente
- Se falhar com erro de chunk (404/TypeError), faz `window.location.reload()` automaticamente uma unica vez
- Usa `sessionStorage` para evitar loop infinito de reloads
- Apos o reload, o browser busca o novo `index.html` com os hashes corretos

```text
lazyWithRetry(importFn):
  1. Tenta importFn()
  2. Se falhar:
     a. Verifica sessionStorage["chunk-reload-<path>"]
     b. Se nao recarregou ainda -> marca e faz window.location.reload()
     c. Se ja recarregou -> rejeita o erro (ErrorBoundary mostra fallback)
```

### 2. Substituir todos os `lazy()` por `lazyWithRetry()` em `src/App.tsx`

Trocar as 55 ocorrencias de `lazy(() => import(...))` por `lazyWithRetry(() => import(...))`.

### 3. Melhorar o ErrorBoundary para detectar erros de chunk

Quando o erro for especificamente de import dinamico ("Failed to fetch dynamically imported module"), o ErrorBoundary vai:
- Exibir mensagem mais clara: "Nova versao disponivel"
- O botao "Recarregar" ja existe e funciona corretamente para este caso

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/utils/lazyWithRetry.ts` | Criar - helper com retry + auto-reload |
| `src/App.tsx` | Alterar - trocar `lazy()` por `lazyWithRetry()` |
| `src/components/ErrorBoundary.tsx` | Alterar - mensagem especifica para chunk errors |

## Resultado

- Apos deploy, usuario e redirecionado automaticamente para a versao nova (transparente)
- Se o reload automatico falhar, ErrorBoundary mostra mensagem clara com botao recarregar
- Zero loops infinitos gracas ao controle via sessionStorage
