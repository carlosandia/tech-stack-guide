

## Corrigir payload do evento de teste CAPI para aparecer no Meta Events Manager

### Problema identificado

Os logs do servidor mostram que o Meta aceita o evento (`events_received: 1`), mas ele nao aparece na aba "Eventos de teste" do Gerenciador de Eventos. A causa raiz esta no payload enviado:

- `action_source: 'system_generated'` faz o Meta nao exibir na interface de teste
- `user_data` contendo apenas `client_ip_address: '0.0.0.0'` e considerado dado invalido
- Ausencia do campo `event_source_url`, obrigatorio para `action_source: 'website'`

### Solucao

Alterar o payload do evento de teste na Edge Function para usar valores que o Meta reconhece e exibe na interface.

### Alteracoes

#### Arquivo: `supabase/functions/test-capi-event/index.ts`

Modificar o objeto `capiPayload` (linhas 118-128):

**Antes:**
```typescript
const capiPayload = {
  data: [
    {
      event_name: 'Lead',
      event_time: eventTime,
      action_source: 'system_generated',
      user_data: { client_ip_address: '0.0.0.0' },
    },
  ],
  test_event_code: testEventCode,
}
```

**Depois:**
```typescript
const capiPayload = {
  data: [
    {
      event_name: 'Lead',
      event_time: eventTime,
      action_source: 'website',
      event_source_url: 'https://crm.renovedigital.com.br',
      user_data: {
        em: ['309a0a5c3e211326ae75571f882866e0b8de3131acf14c3f89044e1d868e2c2c'],
        client_ip_address: '127.0.0.1',
        client_user_agent: 'CRM-Test/1.0',
      },
    },
  ],
  test_event_code: testEventCode,
}
```

Mudancas:
- `action_source` de `'system_generated'` para `'website'`
- Adicionado `event_source_url` com a URL real do CRM
- `user_data.em` com hash SHA-256 de um email de teste (formato que o Meta espera)
- `client_ip_address` de `'0.0.0.0'` para `'127.0.0.1'`
- Adicionado `client_user_agent`

### Arquivo modificado

| Arquivo | Acao |
|---------|------|
| `supabase/functions/test-capi-event/index.ts` | Corrigir payload do evento de teste |

