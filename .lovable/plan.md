

## Importar Publicos Personalizados existentes do Meta Ads

### Resumo
Adicionar a funcionalidade de buscar publicos personalizados ja existentes na conta de anuncios do Meta, alem de manter a opcao de criar novos. O usuario podera clicar em "Importar do Meta" para ver os publicos existentes e selecionar quais deseja vincular ao CRM.

### 1. Criar Edge Function `meta-audiences`

Nova Edge Function em `supabase/functions/meta-audiences/index.ts` que:

- Recebe POST autenticado com `{ action: "list", ad_account_id: "act_xxx" }`
- Busca `access_token` da tabela `conexoes_meta` (status `ativo` ou `conectado`)
- Chama `GET https://graph.facebook.com/v21.0/act_{ad_account_id}/customaudiences?fields=id,name,approximate_count&access_token={token}`
- Retorna a lista de publicos existentes no Meta

### 2. Atualizar `configuracoes.api.ts`

Adicionar nova funcao `buscarAudiencesMeta(adAccountId: string)` no `metaAdsApi` que invoca a Edge Function `meta-audiences`.

### 3. Atualizar `CustomAudiencesPanel.tsx`

- Adicionar botao "Importar do Meta" ao lado de "Criar Publico"
- Ao clicar, exibe campo para informar o `ad_account_id` e botao "Buscar"
- Lista os publicos retornados do Meta com checkbox para selecionar
- Botao "Importar Selecionados" salva os publicos escolhidos na tabela `custom_audiences_meta` com o `audience_id` real do Meta (nao mais `pending_xxx`)

### 4. Registrar funcao no `config.toml`

Adicionar `[functions.meta-audiences]` com `verify_jwt = false`.

### Fluxo do usuario

```text
+---------------------------+      +---------------------------+
| Publicos Personalizados   |      | Publicos Personalizados   |
|                           |      |                           |
| [+ Criar] [Importar Meta] |  ->  | Conta: [act_123] [Buscar] |
|                           |      |                           |
|  (lista vazia ou existente)|      | [ ] Lookalike BR (1.2M)  |
|                           |      | [ ] Retargeting (500K)   |
|                           |      | [Importar Selecionados]  |
+---------------------------+      +---------------------------+
```

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/meta-audiences/index.ts` | Criar |
| `supabase/config.toml` | Adicionar entrada |
| `src/modules/configuracoes/services/configuracoes.api.ts` | Adicionar `buscarAudiencesMeta` |
| `src/modules/configuracoes/components/integracoes/meta/CustomAudiencesPanel.tsx` | Adicionar UI de importacao |

### Detalhes tecnicos

- Endpoint Meta: `GET /v21.0/act_{ad_account_id}/customaudiences?fields=id,name,approximate_count`
- A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` para ler o `access_token` criptografado de `conexoes_meta`
- Ao importar, o `audience_id` salvo sera o ID real do Meta (ex: `23851234567890`) em vez de `pending_xxx`
- Publicos ja importados (mesmo `audience_id`) serao filtrados da lista para evitar duplicatas
- CORS headers padrao incluidos na Edge Function

