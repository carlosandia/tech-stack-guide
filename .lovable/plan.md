

## Edge Function `meta-leadgen-webhook` + Contagem de Leads

### Contexto
Atualmente nao existe nenhum endpoint para receber webhooks `leadgen` do Meta. Quando um lead preenche um formulario Lead Ads no Facebook, o Meta envia um POST para uma URL configurada, mas nao ha nada no sistema para recebe-lo. A contagem "Leads: 0" no card reflete isso -- nunca nenhum lead foi processado.

### O que sera construido

**1. Nova Edge Function `meta-leadgen-webhook`**

Endpoint que recebe webhooks do Meta Lead Ads com duas responsabilidades:

- **GET** (Verificacao): Responde ao challenge de verificacao do Meta usando `hub.verify_token` e `hub.challenge`
- **POST** (Processamento de leads): Recebe eventos `leadgen`, busca dados completos do lead via Graph API, cria contato + oportunidade no CRM

Fluxo do POST:
1. Recebe payload `{ entry: [{ changes: [{ field: "leadgen", value: { form_id, leadgen_id, page_id } }] }] }`
2. Busca a pagina em `paginas_meta` pelo `page_id` para obter `page_access_token_encrypted` e `organizacao_id`
3. Busca configuracao em `formularios_lead_ads` pelo `form_id` e `organizacao_id` para obter `funil_id`, `etapa_destino_id` e `mapeamento_campos`
4. Chama Graph API `GET /{leadgen_id}?access_token={page_token}` para obter os dados do lead (nome, email, telefone, etc.)
5. Aplica o mapeamento de campos para extrair dados de contato
6. Cria ou atualiza contato em `contatos`
7. Cria oportunidade em `oportunidades` na pipeline/etapa configurada
8. Incrementa `total_leads_recebidos` e atualiza `ultimo_lead_recebido` em `formularios_lead_ads`

**2. Configuracao em `config.toml`**

Adicionar `verify_jwt = false` pois o webhook e chamado pelo Meta (sem JWT).

**3. Verify Token**

Usar um token fixo armazenado em `configuracoes_globais` (campo `meta_webhook_verify_token`) ou como secret. O usuario configura esse mesmo token no Meta Developer Portal.

### Detalhes Tecnicos

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/meta-leadgen-webhook/index.ts` | Nova Edge Function completa |
| `supabase/config.toml` | Adicionar `[functions.meta-leadgen-webhook]` com `verify_jwt = false` |

**Fluxo de mapeamento de campos:**
O `mapeamento_campos` em `formularios_lead_ads` contem um array `[{ form_field, crm_field }]`. Os campos do lead retornados pela Graph API vem como `field_data: [{ name, values }]`. O sistema cruza `form_field` com `name` e aplica o valor ao campo CRM correspondente (ex: `crm_field = "nome"` vai para `contatos.nome`).

**Contagem de leads:**
Apos processar com sucesso, a function incrementa `total_leads_recebidos` e seta `ultimo_lead_recebido = NOW()` na tabela `formularios_lead_ads`. Isso faz o "Leads: 0" do card atualizar automaticamente.

**Seguranca:**
- Sem JWT (webhook externo), mas valida a origem pelo `page_id` existir em `paginas_meta`
- Opcionalmente valida assinatura HMAC do Meta (usando `X-Hub-Signature-256` header e o `app_secret`)

