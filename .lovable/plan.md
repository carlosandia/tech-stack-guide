

## Sincronizar Publicos Personalizados com Eventos CAPI

### Resumo

Implementar a funcionalidade para que, quando um evento de conversao ocorre no CRM (Lead, MQL, Agendamento, Oportunidade Ganha/Perdida), os contatos envolvidos sejam automaticamente adicionados ao Publico Personalizado vinculado no Meta Ads.

### Arquitetura do fluxo

```text
CRM Evento (ex: novo lead)
    |
    v
Trigger DB -> eventos_automacao (tipo: contato_criado)
    |
    v
processar-eventos-automacao (existente)
    |
    v  (nova logica: verificar audiences com evento_gatilho correspondente)
    |
    v
Edge Function sync-audience-capi (nova)
    |
    v
Meta Graph API: POST /{audience_id}/users (adiciona contato hashado)
    |
    v
Atualiza total_usuarios e ultimo_sync na tabela custom_audiences_meta
```

### Alteracoes

#### 1. Nova Edge Function: `supabase/functions/sync-audience-capi/index.ts`

Responsavel por receber dados do contato e do audience, e enviar para a Meta API:

- Recebe POST com `{ audience_id, ad_account_id, organizacao_id, contato: { email, telefone, nome } }`
- Busca `access_token` de `conexoes_meta`
- Faz hash SHA-256 dos dados do contato (email, telefone, nome) conforme exigencia do Meta
- Chama `POST https://graph.facebook.com/v21.0/{audience_id}/users` com schema de Custom Audience
- Atualiza `total_usuarios` e `ultimo_sync` em `custom_audiences_meta`

#### 2. Modificar Edge Function: `supabase/functions/processar-eventos-automacao/index.ts`

Apos processar cada evento, adicionar logica para:

- Mapear tipo do evento para `evento_gatilho` da audience:
  - `contato_criado` (tipo=pessoa) -> `lead`
  - `oportunidade_qualificada` (tipo_qualificacao=MQL) -> `mql`
  - `reuniao_agendada` -> `schedule` (usar trigger `reuniao_agendada` de `audit_reunioes_fn`)
  - `oportunidade_ganha` -> `won`
  - `oportunidade_perdida` -> `lost`
- Buscar audiences ativas com `evento_gatilho` correspondente em `custom_audiences_meta`
- Para cada audience encontrada, buscar dados do contato (email, telefone) e invocar `sync-audience-capi`

#### 3. Atualizar UI: `CustomAudiencesPanel.tsx`

- Ao listar audiences importadas (sem `evento_gatilho`), mostrar um select inline para configurar o evento gatilho
- Permitir editar o `evento_gatilho` de qualquer audience existente diretamente na listagem
- Botao "Sincronizar Agora" passara a chamar a Edge Function `sync-audience-capi` com os contatos relevantes do CRM (baseado no evento gatilho)

#### 4. Atualizar `configuracoes.api.ts`

- Adicionar funcao `vincularEventoAudience(id, evento_gatilho)` que faz update na tabela
- Atualizar `sincronizarAudience` para invocar a Edge Function `sync-audience-capi` com contatos do CRM

#### 5. Registrar nova funcao em `supabase/config.toml`

```toml
[functions.sync-audience-capi]
verify_jwt = false
```

### Mapeamento de eventos

| Evento CRM (eventos_automacao.tipo) | evento_gatilho (audience) | Dados do contato |
|--------------------------------------|---------------------------|------------------|
| contato_criado (tipo=pessoa)         | lead                      | email, telefone, nome via contato_id |
| oportunidade_qualificada (MQL)       | mql                       | contato_id da oportunidade |
| reuniao_agendada                     | schedule                  | contato via oportunidade |
| oportunidade_ganha                   | won                       | contato_id da oportunidade |
| oportunidade_perdida                 | lost                      | contato_id da oportunidade |

### Requisitos do Meta Custom Audiences API

- Endpoint: `POST /{audience_id}/users`
- Payload:
```json
{
  "payload": {
    "schema": ["EMAIL", "PHONE", "FN"],
    "data": [
      ["sha256_email", "sha256_phone", "sha256_first_name"]
    ]
  }
}
```
- Todos os valores devem ser normalizados (lowercase, trim) e hashados em SHA-256 antes do envio
- O access_token e obtido da tabela `conexoes_meta`

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/sync-audience-capi/index.ts` | Criar |
| `supabase/functions/processar-eventos-automacao/index.ts` | Modificar (adicionar hook de audiences) |
| `supabase/config.toml` | Adicionar entrada |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Adicionar/atualizar funcoes |
| `src/modules/configuracoes/components/integracoes/meta/CustomAudiencesPanel.tsx` | Adicionar select de evento inline |
