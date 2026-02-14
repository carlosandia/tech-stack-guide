

# Sincronizacao mais rapida de etiquetas WhatsApp -> CRM

## O que sera feito

Tres alteracoes no arquivo `src/modules/conversas/pages/ConversasPage.tsx`:

### 1. Reduzir polling de 60s para 15s
Linha 110: alterar `60000` para `15000`. Isso reduz a espera maxima de 1 minuto para 15 segundos.

### 2. Sync imediato ao voltar para a aba
Adicionar um novo `useEffect` logo apos o polling que escuta o evento `visibilitychange` do navegador. Quando o usuario volta para a aba do CRM, dispara `sincronizarLabels.mutate()` imediatamente.

### 3. Sync ao clicar em uma conversa
Adicionar logica no `setConversaAtivaId` para disparar sync de labels quando o usuario seleciona uma conversa, garantindo que as etiquetas estejam atualizadas ao abrir o chat.

## Detalhes tecnicos

**Arquivo:** `src/modules/conversas/pages/ConversasPage.tsx`

Alteracao 1 - Linha 110:
```typescript
// De:
}, 60000)
// Para:
}, 15000)
```

Alteracao 2 - Novo useEffect apos linha 112:
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && sessionNameRef.current && !sincronizarLabels.isPending) {
      sincronizarLabels.mutate(sessionNameRef.current)
    }
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
}, [sincronizarLabels])
```

## Resultado esperado

- Demora maxima para ver etiqueta alterada no dispositivo: **15 segundos** (antes era 60s)
- Ao alternar de aba e voltar ao CRM: **atualizacao imediata**
- Nenhum impacto em performance (a chamada WAHA e leve)

