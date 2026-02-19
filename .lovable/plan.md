

## Corrigir painel de Publicos Personalizados (Custom Audiences)

### Problema
As funcoes `listarAudiences`, `criarAudience`, `atualizarAudience` e `sincronizarAudience` usam `api.get/post/patch` (backend Express em `localhost:3001`), que nao esta rodando neste ambiente. Precisam ser migradas para usar Supabase diretamente, seguindo o mesmo padrao ja usado no restante do arquivo.

### Solucao

Migrar as 4 funcoes do `metaAdsApi` para usar o cliente Supabase diretamente contra a tabela `custom_audiences_meta` que ja existe no banco.

### Alteracoes

**Arquivo: `src/modules/configuracoes/services/configuracoes.api.ts`**

Substituir as 4 funcoes (linhas 1638-1653) por implementacoes Supabase:

1. **`listarAudiences`** - `supabase.from('custom_audiences_meta').select('*').is('deletado_em', null).order('criado_em', { ascending: false })`
2. **`criarAudience`** - Insert com `organizacao_id` obtido via `getOrganizacaoId()`, gerando `audience_id` provisorio
3. **`atualizarAudience`** - Update por `id` (para toggle ativo/inativo e outros campos)
4. **`sincronizarAudience`** - Update do campo `ultimo_sync` com timestamp atual (sincronizacao real com Meta sera implementada futuramente)

### Detalhes tecnicos

- Tabela `custom_audiences_meta` ja existe com colunas: `id`, `organizacao_id`, `audience_id`, `audience_name`, `ad_account_id`, `tipo_sincronizacao`, `evento_gatilho`, `total_usuarios`, `ultimo_sync`, `ativo`, `criado_em`, `deletado_em`
- O campo `audience_id` e `NOT NULL` na tabela, entao ao criar sera preenchido com valor provisorio (ex: `pending_<timestamp>`)
- RLS filtra automaticamente por `organizacao_id`
- Segue o padrao existente no arquivo usando `getOrganizacaoId()`

