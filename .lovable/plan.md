
# Diagnostico: Webhook Meta Lead Ads

## Situacao Atual

A investigacao completa dos logs revelou:

### O que esta funcionando
- A Edge Function `meta-leadgen-webhook` esta ativa e recebendo requisicoes
- O teste via "Enviar para servidor v24.0" (seção Webhooks do Meta Developer Portal) **chegou com sucesso**
- O `meta-sync` inscreveu corretamente o app em `leadgen` para a pagina "Carlos Andia"
- O campo `leadgen` esta "Assinado" no portal do Meta

### O que foi encontrado nos logs

```text
INFO  Payload recebido: {"entry":[{"changes":[{"field":"leadgen","value":{"page_id":"444444444444","form_id":"444444444444",...}}]}]}
ERROR Pagina nao encontrada para page_id=444444444444
```

O payload com `page_id=444444444444` sao **dados ficticios** do teste generico do Meta. O erro e esperado - nao e uma pagina real no banco.

### O problema real

A **Lead Ads Testing Tool** (`/tools/lead-ads-testing/`) nao esta disparando eventos para o webhook. Possiveis causas:

1. **Permissao `pages_manage_ads`**: O ultimo diff adicionou essa permissao ao escopo OAuth, porem o token salvo no banco (`page_access_token_encrypted`) foi gerado **antes** dessa alteracao. O Meta pode exigir essa permissao para que a ferramenta de teste envie eventos.

2. **Reconexao necessaria**: Como os escopos mudaram, o usuario precisa **reconectar** o Meta nas Conexoes do CRM para gerar um novo token com as permissoes atualizadas.

3. **Atraso do Meta**: A ferramenta de teste do Lead Ads pode ter um delay de ate 2-3 minutos para disparar o webhook.

## Plano de Acao

### Passo 1: Corrigir build error (Stripe)
O build esta falhando por causa de um import `npm:stripe@17` na Edge Function `complete-onboarding`. Corrigir o import para usar o formato correto do Deno.

### Passo 2: Reconectar Meta
A recomendacao principal e: **reconectar o Meta Ads** na pagina de Conexoes do CRM. Isso vai gerar um novo token OAuth com a permissao `pages_manage_ads` que foi adicionada no ultimo diff, e re-executar o `meta-sync` que reinscreve o app nos eventos `leadgen`.

### Passo 3: Testar novamente
1. Apos reconectar, acessar `https://developers.facebook.com/tools/lead-ads-testing/`
2. Selecionar a pagina "Carlos Andia" e o formulario correto
3. Clicar em "Delete lead" e depois "Create lead"
4. Verificar os logs da Edge Function `meta-leadgen-webhook` para confirmar recebimento com IDs reais (nao `444444444444`)

## Detalhes Tecnicos

### Arquivo a corrigir
- `supabase/functions/complete-onboarding/index.ts` - corrigir import do Stripe que causa build error

### Resumo do fluxo de Lead Ads
```text
Meta Lead Ads Testing Tool
  |
  v (webhook POST com page_id real, ex: 692963887238504)
meta-leadgen-webhook Edge Function
  |
  v (busca paginas_meta por page_id)
  v (busca formularios_lead_ads por form_id)
  v (busca dados do lead via Graph API com page_access_token)
  v (cria contato + oportunidade no CRM)
```

O token precisa ter as permissoes corretas para que o Graph API retorne os dados do lead no passo de busca.
