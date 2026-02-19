
## Implementar envio real de evento teste para Meta CAPI + Renomear label

### 1. Criar Edge Function `test-capi-event`

Nova Edge Function em `supabase/functions/test-capi-event/index.ts` que:

- Recebe POST autenticado do frontend
- Busca `pixel_id` da tabela `config_conversions_api` pela `organizacao_id` do usuario
- Busca `access_token` da tabela `conexoes_meta` pela mesma `organizacao_id`
- Envia um evento de teste (`Lead` com `action_source: system_generated`) para `https://graph.facebook.com/v21.0/{pixel_id}/events`
- Atualiza `config_conversions_api` com `ultimo_teste`, `ultimo_teste_sucesso` (true/false) baseado na resposta real do Meta
- Retorna resultado (sucesso + event_id ou erro + mensagem do Meta)

Payload enviado ao Meta (formato padrao CAPI):
```json
{
  "data": [{
    "event_name": "Lead",
    "event_time": <unix_timestamp>,
    "action_source": "system_generated",
    "user_data": { "client_ip_address": "0.0.0.0" }
  }],
  "test_event_code": "TEST_EVENT_<timestamp>"
}
```

### 2. Atualizar frontend - `configuracoes.api.ts`

Substituir a funcao `testarCapi` para chamar a Edge Function via `supabase.functions.invoke('test-capi-event')` ao inves de apenas atualizar o banco localmente.

### 3. Renomear label no `CapiConfigPanel.tsx`

Alterar o evento `won` de:
- `label: 'Venda Fechada (Won)'` para `label: 'Oportunidade Ganha'`

### 4. Registrar funcao no `config.toml`

Adicionar `[functions.test-capi-event]` com `verify_jwt = false`.

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/test-capi-event/index.ts` | Criar (Edge Function) |
| `supabase/config.toml` | Adicionar entrada da funcao |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Alterar `testarCapi` |
| `src/modules/configuracoes/components/integracoes/meta/CapiConfigPanel.tsx` | Renomear label "won" |

### Detalhes tecnicos

- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para ler o `access_token` de `conexoes_meta` (dado sensivel protegido por RLS)
- Validacao JWT via `getClaims()` para identificar o usuario e obter a `organizacao_id`
- CORS headers padrao incluidos
- Se o token Meta estiver expirado ou ausente, retorna erro claro orientando reconexao
