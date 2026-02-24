

# Correcao: Audio desaparece apos envio + Timer acelerado

## Problema 1: Audio (e midias) aparece e some

### Causa Raiz
A query `listarMensagens` ordena por `timestamp_externo DESC NULLS LAST`. Mensagens inseridas pelo CRM (`enviarMedia`, `enviarTexto`) NAO definem `timestamp_externo`, ficando com valor `NULL`. Com `NULLS LAST` em ordem descendente, essas mensagens vao para o FINAL da lista - potencialmente alem da pagina 1 (limit 50), sumindo da UI quando o `invalidateQueries` refaz o fetch.

Fluxo:
1. `onMutate` → mensagem otimista aparece (corretamente)
2. `mutationFn` executa → insere no banco SEM `timestamp_externo`
3. `onSettled` → `invalidateQueries` → refetch
4. Query retorna mensagens ordenadas por `timestamp_externo DESC NULLS LAST`
5. A nova mensagem (timestamp NULL) cai apos todas com timestamp → fora da pagina 1
6. Mensagem some da UI

### Correcao
Adicionar `timestamp_externo: Math.floor(Date.now() / 1000)` nos inserts de `enviarMedia` e `enviarTexto` em `conversas.api.ts`. Isso garante que mensagens do CRM tenham a mesma prioridade de ordenacao que mensagens do webhook.

**Arquivo: `src/modules/conversas/services/conversas.api.ts`**

Na funcao `enviarTexto` (insert, ~linha 887): adicionar `timestamp_externo: Math.floor(Date.now() / 1000)`

Na funcao `enviarMedia` (insert, ~linha 961): adicionar `timestamp_externo: Math.floor(Date.now() / 1000)`

---

## Problema 2: Timer conta 2x mais rapido

### Causa Raiz
O `cleanup()` reseta `startedRef.current = false`. No React StrictMode:

1. Mount → useEffect → startedRef=false → set true → startRecording() (getUserMedia = async, pendente)
2. StrictMode unmount → cleanup() → clearInterval(null pois timer nao existe ainda), startedRef=false
3. Remount → useEffect → startedRef=false → set true → startRecording() (novo getUserMedia async)
4. getUserMedia do passo 1 resolve → cria interval #1
5. getUserMedia do passo 3 resolve → cria interval #2 (sobrescreve ref, mas #1 continua rodando)

Resultado: dois `setInterval` simultâneos, timer conta 2x por segundo.

### Correcao
Usar um "generation counter" (ref numerica) para invalidar callbacks de montagens anteriores. Apos o `await getUserMedia`, verificar se a geracao atual ainda e valida. Se nao for, descartar o stream e abortar.

**Arquivo: `src/modules/conversas/components/AudioRecorder.tsx`**

- Substituir `startedRef` por `generationRef` (useRef de numero)
- No useEffect, incrementar a geracao e passar para `startRecording`
- Em `startRecording`, apos o `await getUserMedia`, verificar se a geracao ainda e a atual. Se nao, parar o stream e retornar sem criar interval
- Remover `startedRef.current = false` do cleanup (nao mais necessario)

Logica:

```text
Mount #1: gen=1, startRecording(1) — getUserMedia pending
Unmount:  cleanup() — limpa timer/stream
Mount #2: gen=2, startRecording(2) — getUserMedia pending
getUserMedia #1 resolve: gen(1) !== generationRef(2) → stop stream, return
getUserMedia #2 resolve: gen(2) === generationRef(2) → cria UM unico interval
```

---

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `conversas.api.ts` | Adicionar `timestamp_externo` nos inserts de `enviarTexto` e `enviarMedia` |
| `AudioRecorder.tsx` | Substituir guard `startedRef` por `generationRef` com verificacao pos-await |

## Resultado esperado

- Midias enviadas permanecem visiveis no chat apos o refetch (timestamp_externo garante posicao na pagina 1)
- Timer do audio conta exatamente 1 segundo por segundo, mesmo em StrictMode

