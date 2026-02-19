
## Correcao: Paginas e formularios do Meta nao carregam

### Problema raiz

Todas as chamadas da `metaAdsApi` (listar paginas, formularios, pipelines via `api.get(...)`) usam o cliente Axios que aponta para o backend Express em `VITE_API_URL`. Essa variavel **nao esta configurada** no ambiente — o padrao e `http://localhost:3001`, que nao existe no ambiente de producao/preview. Por isso o dropdown "Selecione uma pagina" fica vazio: a requisicao falha silenciosamente.

### Solucao

Criar uma **Supabase Edge Function** chamada `meta-pages` que:
1. Autentica o usuario via header Authorization
2. Busca o `access_token_encrypted` da tabela `conexoes_meta` para a organizacao do usuario
3. Chama a Graph API do Facebook (`/me/accounts` para paginas, `/{pageId}/leadgen_forms` para formularios)
4. Retorna os dados no formato esperado pelo frontend

Atualizar o frontend `configuracoes.api.ts` para usar `supabase.functions.invoke()` ao inves de `api.get()` nos metodos `listarPaginas` e `listarFormulariosPagina`.

### Detalhes tecnicos

**1. Nova Edge Function `supabase/functions/meta-pages/index.ts`**

- Recebe `action` via query param: `pages` ou `forms`
- Para `forms`, recebe tambem `page_id`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para ler `conexoes_meta.access_token_encrypted`
- Busca `organizacao_id` do usuario na tabela `usuarios` (mesmo padrao do `meta-auth`)
- Chama Graph API v21.0:
  - Paginas: `GET https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token={token}`
  - Formularios: `GET https://graph.facebook.com/v21.0/{pageId}/leadgen_forms?fields=id,name,status,questions&access_token={page_access_token}`
- Usa import `npm:@supabase/supabase-js@2` (evita timeout de bundle que ocorreu com `esm.sh`)

**2. Atualizar `src/modules/configuracoes/services/configuracoes.api.ts`**

Substituir os metodos que usam `api.get()` (Express) por chamadas diretas a Edge Function via `fetch`:

```typescript
listarPaginas: async () => {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token || ''
  const res = await fetch(
    `${supabaseUrl}/functions/v1/meta-pages?action=pages`,
    { headers: { Authorization: `Bearer ${token}`, apikey: anonKey } }
  )
  if (!res.ok) throw new Error('Erro ao buscar paginas')
  return await res.json()
},

listarFormulariosPagina: async (pageId: string) => {
  // Similar, com action=forms&page_id=...
}
```

**3. Manter `listarFormularios` (listagem de mapeamentos salvos)**

Esse metodo lista formularios ja mapeados salvos no banco. Deve ser migrado de `api.get()` para uma query Supabase direta na tabela de mapeamentos (se existir), ou tambem via Edge Function.

### Sobre Pipeline

O dropdown de Pipeline ja funciona (usa `supabase.from('funis')` diretamente). Conforme a screenshot do usuario, "Vendas - Organica & Trafego" ja aparece. O problema e apenas as paginas/formularios.
