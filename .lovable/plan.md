
# Atualizar versao da Graph API de v21.0 para v24.0

## Problema identificado
O Meta Developer Portal do app Renove CRM (ID: 1550529759333099) esta configurado na **v24.0**, porem todo o codigo das Edge Functions e do backend utiliza **v21.0** (e um arquivo usa v18.0). Essa incompatibilidade pode causar falhas silenciosas nas chamadas da Graph API, especialmente no `subscribed_apps` para leadgen e na busca de dados do lead.

## Resumo das alteracoes

Atualizar a constante de versao da Graph API de `v21.0` para `v24.0` em todos os 9 arquivos que referenciam a URL da Graph API.

## Arquivos a alterar

### 1. supabase/functions/meta-leadgen-webhook/index.ts
- Linha 15: `const GRAPH_API_VERSION = "v21.0"` -> `"v24.0"`

### 2. supabase/functions/meta-sync/index.ts
- Linha 14: `const GRAPH_API = "https://graph.facebook.com/v21.0"` -> `"v24.0"`

### 3. supabase/functions/meta-callback/index.ts
- Todas as URLs hardcoded `graph.facebook.com/v21.0` -> `v24.0`

### 4. supabase/functions/meta-audiences/index.ts
- Todas as URLs hardcoded `graph.facebook.com/v21.0` -> `v24.0`

### 5. supabase/functions/send-capi-event/index.ts
- URL `graph.facebook.com/v21.0` -> `v24.0`

### 6. supabase/functions/test-capi-event/index.ts
- URL `graph.facebook.com/v21.0` -> `v24.0`

### 7. supabase/functions/sync-audience-capi/index.ts
- URLs `graph.facebook.com/v21.0` -> `v24.0`

### 8. backend/src/services/meta.service.ts
- Linha 32: `const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'` -> `'v24.0'`

### 9. backend/src/services/config-global.service.ts
- URL `graph.facebook.com/v18.0` -> `v24.0` (esta ainda mais desatualizada)

## Observacoes adicionais

- **Nivel de acesso "Development"**: O app esta em nivel Development para a API de Anuncios. Isso nao impede o recebimento de webhooks de Lead Ads, pois o teste ocorre no contexto do desenvolvedor. Porem, para producao com usuarios externos, sera necessario solicitar **Standard Access** via App Review.
- **Campo "Autorizar URL de retorno de chamada"**: Esta vazio nas configuracoes avancadas. Recomendado preencher com `https://crm.renovedigital.com.br/configuracoes/conexoes` para seguranca adicional.
- Apos a atualizacao, sera necessario **reconectar o Meta Ads** e testar novamente com a Lead Ads Testing Tool.
