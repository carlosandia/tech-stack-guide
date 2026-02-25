
## Plano: Inverter fluxo de teste CAPI - Aceitar codigo do Meta como input

### Problema

O fluxo atual gera um `test_event_code` no servidor e pede ao usuario para cola-lo no Meta. Porem, o Meta **gera seu proprio codigo** (ex: `TEST26342`) e espera que esse codigo seja enviado junto com o evento via API. O campo no Meta e somente leitura (copiar), nao aceita colar.

### Fluxo correto

1. Usuario abre o Gerenciador de Eventos do Meta > aba "Testar eventos"
2. Meta exibe um codigo unico (ex: `TEST26342`) com botao "Copiar"
3. Usuario cola esse codigo no CRM
4. CRM envia o evento para a CAPI usando esse codigo no campo `test_event_code`
5. O evento aparece na tela do Meta em tempo real

### Alteracoes

#### 1. `src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx`

- Remover o bloco de exibicao inline do `testEventCode` gerado pelo servidor
- Adicionar um campo de input para o usuario colar o codigo do Meta
- Estado `testEventCode` passa de output para input (o usuario digita/cola)
- Instrucoes claras: "Cole aqui o codigo de teste do Gerenciador de Eventos do Meta"
- Link direto para o Events Manager
- Botao "Enviar Evento Teste" so habilita quando ha codigo preenchido
- Apos envio com sucesso, toast simples de confirmacao

#### 2. `src/modules/configuracoes/services/configuracoes.api.ts`

- Alterar `testarCapi()` para aceitar parametro `testEventCode: string`
- Passar o codigo no body da chamada da Edge Function

#### 3. `supabase/functions/test-capi-event/index.ts`

- Ler `test_event_code` do body da requisicao (enviado pelo frontend)
- Remover a geracao automatica `TEST_EVENT_${eventTime}`
- Usar o codigo recebido no payload enviado ao Meta

### Detalhes tecnicos

**CapiConfigPanel.tsx** - Secao de teste:

```text
+---------------------------------------------+
| Testar Conversions API                       |
|                                              |
| 1. Abra o Gerenciador de Eventos do Meta     |
|    [Link: Abrir Events Manager]              |
|                                              |
| 2. Copie o codigo de teste exibido la        |
|                                              |
| 3. Cole aqui:                                |
|    [_________________________] (input)       |
|                                              |
| [Enviar Evento Teste] (habilitado se input)  |
+---------------------------------------------+
```

**Edge Function** - Mudanca no payload:

```typescript
// Antes: const testEventCode = `TEST_EVENT_${eventTime}`
// Depois: ler do body
const body = await req.json()
const testEventCode = body?.test_event_code
```

**API service** - Parametro:

```typescript
testarCapi: async (testEventCode: string) => {
  const { data, error } = await supabase.functions.invoke('test-capi-event', {
    method: 'POST',
    body: { test_event_code: testEventCode },
  })
  // ...
}
```

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx` | Input para codigo do Meta, instrucoes, link |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Passar `test_event_code` como parametro |
| `supabase/functions/test-capi-event/index.ts` | Ler codigo do body em vez de gerar |
