
## Plano: Criar Edge Function send-capi-event e integrar ao motor de eventos

### Problema identificado

O sistema possui:
- Painel de configuracao CAPI com pixel_id, eventos habilitados (Lead, Schedule, MQL, Won, Lost) - OK
- Edge Function de teste (`test-capi-event`) - OK e funcionando
- Motor de eventos (`processar-eventos-automacao`) que detecta `oportunidade_ganha`, `oportunidade_perdida`, `oportunidade_qualificada`, `contato_criado`, `reuniao_agendada` - OK
- Sincronizacao com Custom Audiences via `sync-audience-capi` - OK

**O que falta**: Nao existe nenhuma Edge Function que envie eventos reais para a Meta Conversions API (`https://graph.facebook.com/v21.0/{pixel_id}/events`). Os eventos sao detectados mas nunca disparados para o Meta CAPI.

### Mapeamento de eventos CRM para Meta

| Evento CRM | Gatilho no motor | Meta Event Name | Dados extras |
|---|---|---|---|
| Oportunidade criada | `oportunidade_criada` (contato_criado nao serve, pois Lead = oportunidade) | `Lead` | contato email/telefone |
| Reuniao agendada | Acao futura (trigger `reuniao_agendada` no emitir_evento_automacao) | `Schedule` | contato email/telefone |
| Lead Qualificado MQL | `oportunidade_qualificada` (tipo MQL) | `CompleteRegistration` | contato email/telefone |
| Oportunidade Ganha | `oportunidade_ganha` | `Purchase` | valor, contato email/telefone |
| Oportunidade Perdida | `oportunidade_perdida` | `Other` | contato email/telefone |

### Alteracoes necessarias

#### 1. Criar `supabase/functions/send-capi-event/index.ts` (NOVO)

Edge Function que recebe o evento do CRM e envia para a Meta CAPI:

```text
Entrada (body):
{
  organizacao_id: string,
  event_name: string,        // Lead, Schedule, CompleteRegistration, Purchase, Other
  contato_id: string,
  valor?: number,             // apenas para Purchase
  oportunidade_id?: string,   // ID da oportunidade para rastreabilidade
  event_source_url?: string
}
```

Logica:
1. Buscar `config_conversions_api` da organizacao (pixel_id, eventos_habilitados, config_eventos)
2. Verificar se o evento esta habilitado em `eventos_habilitados`
3. Buscar `access_token_encrypted` da `conexoes_meta`
4. Buscar dados do contato (email, telefone) e fazer hash SHA-256
5. Montar payload CAPI com `action_source: 'website'`, `event_source_url`, `user_data` hashado
6. Para Purchase: incluir `custom_data.value` e `custom_data.currency` se `config_eventos.won.enviar_valor` estiver ativo
7. Enviar para `https://graph.facebook.com/v21.0/{pixel_id}/events`
8. Atualizar contadores `total_eventos_enviados` e `total_eventos_sucesso`
9. Registrar na tabela `log_eventos_capi` (opcional, para auditoria)

Payload CAPI enviado ao Meta:
```text
{
  data: [{
    event_name: "Purchase",
    event_time: <unix_timestamp>,
    action_source: "website",
    event_source_url: "https://crm.renovedigital.com.br",
    user_data: {
      em: ["<sha256_email>"],       // email hashado
      ph: ["<sha256_telefone>"],    // telefone hashado
      client_ip_address: "127.0.0.1",
      client_user_agent: "CRM-Server/1.0"
    },
    custom_data: {                  // apenas para Purchase
      value: 15000.00,
      currency: "BRL",
      content_name: "<titulo_oportunidade>",
      content_ids: ["<oportunidade_id>"]
    }
  }]
}
```

#### 2. Alterar `supabase/functions/processar-eventos-automacao/index.ts`

Adicionar uma funcao `enviarEventoConversionsApi()` chamada no loop principal (similar a `sincronizarCustomAudiences`):

```text
Mapeamento:
  oportunidade_criada    -> event_name: "Lead",                key: "lead"
  reuniao_agendada (*)   -> event_name: "Schedule",            key: "schedule"  
  oportunidade_qualificada (MQL) -> event_name: "CompleteRegistration", key: "mql"
  oportunidade_ganha     -> event_name: "Purchase",            key: "won"
  oportunidade_perdida   -> event_name: "Other",               key: "lost"
```

Para cada evento processado:
1. Verificar se o tipo esta no mapeamento CAPI
2. Chamar `send-capi-event` via fetch interno com service_role_key
3. Passar organizacao_id, event_name, contato_id, valor (se won)

(*) Nota: O trigger `emitir_evento_automacao` na tabela de reunioes nao esta implementado ainda. A reuniao agendada precisara ser adicionada como trigger separado ou via outro mecanismo. Isso sera documentado como pendencia.

#### 3. Atualizar `supabase/config.toml`

Adicionar configuracao para a nova funcao:
```text
[functions.send-capi-event]
verify_jwt = false
```

### Detalhes tecnicos do hash SHA-256

O Meta exige que `user_data` seja enviado com hash SHA-256 (lowercase hex):
- `em`: email em lowercase, sem espacos, hashado
- `ph`: telefone apenas digitos (sem +, espacos, parenteses), hashado

Usando Web Crypto API disponivel no Deno:
```text
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}
```

### Arquivos modificados

| Arquivo | Acao |
|---|---|
| `supabase/functions/send-capi-event/index.ts` | NOVO - Edge Function para enviar eventos reais |
| `supabase/functions/processar-eventos-automacao/index.ts` | Adicionar hook `enviarEventoConversionsApi()` no loop de eventos |
| `supabase/config.toml` | Adicionar `[functions.send-capi-event]` |

### Pendencias futuras (fora deste plano)

- Trigger `reuniao_agendada` no banco: verificar se a funcao `emitir_evento_automacao` ja cobre reunioes (a trigger `audit_reunioes_fn` existe, mas o `emitir_evento_automacao` precisa ser validado para reunioes)
- Tabela de log detalhado `log_eventos_capi` para auditoria (opcional)
