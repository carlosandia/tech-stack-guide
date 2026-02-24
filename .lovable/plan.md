

## Plano: Auto-clear do indicador "digitando..."

### Problema

Quando o WAHA envia um evento `composing` (digitando), os hooks `usePresence` e `useListPresence` atualizam o estado corretamente. Porem, se o WAHA nao enviar um evento subsequente de `paused` ou `unavailable` (o que acontece frequentemente), o status fica travado em "digitando..." para sempre na UI.

### Solucao

Adicionar um **timeout de auto-clear** em ambos os hooks. Sempre que um status `composing` ou `recording` for recebido, um timer de ~7 segundos e iniciado. Se nenhum novo evento chegar nesse periodo, o status e resetado automaticamente. Se um novo evento `composing` chegar antes do timeout, o timer e reiniciado.

---

### Arquivos a modificar

#### 1. `src/modules/conversas/hooks/usePresence.ts`

- Adicionar um `useRef` para o timer de timeout
- Quando `setStatus('composing')` ou `setStatus('recording')` for chamado (tanto no `presence_get` inicial quanto no broadcast), iniciar um `setTimeout` de 7s que faz `setStatus(null)`
- Limpar o timer no cleanup do `useEffect` e quando um novo evento chegar

#### 2. `src/modules/conversas/hooks/useListPresence.ts`

- Adicionar um `Map<string, ReturnType<typeof setTimeout>>` como ref para timers por chatId
- Dentro do `handleUpdate`, quando o status for `composing` ou `recording`, iniciar um timeout de 7s que remove o chatId do `presenceMap`
- Limpar o timer anterior do mesmo chatId antes de criar um novo
- Limpar todos os timers no cleanup do `useEffect`

---

### Detalhes tecnicos

**Timeout de 7 segundos**: O WhatsApp Web usa ~5-10s para considerar que o usuario parou de digitar. 7s e um meio-termo seguro -- curto o suficiente para nao parecer travado, longo o suficiente para nao piscar durante digitacao continua.

**Logica do timer (pseudo-codigo):**

```text
ao receber status 'composing' ou 'recording':
  1. limpar timer anterior (se existir)
  2. setar o status na UI
  3. iniciar novo timer de 7s que reseta o status para null/remove do map

ao receber status 'unavailable', 'paused', 'available' ou null:
  1. limpar timer (se existir)
  2. setar/limpar o status normalmente (comportamento atual)
```

### Nenhuma alteracao de banco ou backend necessaria

A correcao e puramente frontend nos dois hooks de presenca.
