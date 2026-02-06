
# Migrar Service Layer de Axios/Express para Supabase Direto

## Problema Identificado

O arquivo `configuracoes.api.ts` faz todas as chamadas via **Axios** para um backend Express (`http://localhost:3001/api/v1/...`). Como nao existe um servidor Express rodando no ambiente Lovable, todas as paginas de Pipeline (Campos, Produtos, Motivos, Tarefas, Etapas, Regras, Cards) e demais configuracoes retornam "Network Error".

Alem disso, as politicas RLS de 14 tabelas usam `current_setting('app.current_tenant')`, que so funciona quando definido pelo backend. O frontend Supabase client nao define essa variavel, entao o acesso seria bloqueado mesmo com chamadas diretas.

## Solucao

Duas frentes paralelas:

### Parte 1 - Atualizar RLS Policies (Migration SQL)

Criar migration adicionando novas politicas RLS que usam `auth.uid()` via join com tabela `usuarios`, substituindo as que dependem de `app.current_tenant`.

Padrao a ser usado (mesmo ja usado na tabela `configuracoes_tenant`):

```text
organizacao_id = (
  SELECT u.organizacao_id FROM usuarios u WHERE u.auth_id = auth.uid()
)
```

Tabelas afetadas (14 tabelas):
- campos_customizados
- categorias_produtos
- configuracoes_card
- motivos_resultado
- produtos
- tarefas_templates
- etapas_templates
- etapas_tarefas
- regras_qualificacao
- webhooks_entrada
- webhooks_saida
- equipes
- equipes_membros
- metas

Para cada tabela:
1. DROP da policy antiga `tenant_isolation_*` (ALL)
2. DROP das policies de INSERT/UPDATE/DELETE que usam `app.current_tenant`
3. CREATE novas policies usando `auth.uid()` + `usuarios` join
4. Manter compatibilidade com super_admin via `OR EXISTS (SELECT 1 FROM usuarios u WHERE u.auth_id = auth.uid() AND u.role = 'super_admin')`

### Parte 2 - Reescrever configuracoes.api.ts

Reescrever o service layer para usar o cliente Supabase diretamente (`@/lib/supabase`), eliminando a dependencia do Axios/Express.

A logica das queries sera baseada nos backend services existentes (ex: `backend/src/services/campos.service.ts`), adaptando para o frontend:
- Substituir `supabaseAdmin` por `supabase` (respeita RLS)
- Remover parametro `organizacaoId` (RLS filtra automaticamente pelo tenant do usuario logado)
- Manter mesma assinatura de retorno para nao quebrar os hooks

Exemplo da transformacao para Campos:

**Antes (Axios):**
```text
const { data } = await api.get('/v1/campos', { params: { entidade } })
```

**Depois (Supabase direto):**
```text
const { data, error, count } = await supabase
  .from('campos_customizados')
  .select('*', { count: 'exact' })
  .eq('entidade', entidade)
  .is('deletado_em', null)
  .order('ordem', { ascending: true })
```

APIs a migrar:
- `camposApi` - CRUD de campos_customizados
- `produtosApi` - CRUD de produtos + categorias_produtos
- `motivosApi` - CRUD de motivos_resultado + reordenacao
- `tarefasTemplatesApi` - CRUD de tarefas_templates
- `etapasTemplatesApi` - CRUD com join etapas_tarefas + vinculos
- `regrasApi` - CRUD de regras_qualificacao
- `configCardApi` - busca/atualizacao de configuracoes_card
- `integracoesApi` - CRUD de integracoes (parcial, OAuth depende de backend)
- `webhooksApi` - CRUD de webhooks_entrada e webhooks_saida + logs
- `equipeApi` - Equipes, membros, usuarios, perfis
- `metasApi` - CRUD de metas + progresso + ranking
- `configTenantApi` - busca/atualizacao de configuracoes_tenant

### O que NAO muda
- Hooks (useCampos, useMotivos, etc.) - mantem mesma interface
- Paginas (CamposPage, MotivosPage, etc.) - nenhuma alteracao
- Schemas de validacao - permanecem iguais
- AuthProvider - ja funciona via Supabase direto

## Detalhes Tecnicos

### Arquivo de Migration
- `supabase/migrations/[timestamp]_update_rls_auth_uid.sql`
- Contera DROP + CREATE de todas as policies

### Arquivo do Service Layer
- `src/modules/configuracoes/services/configuracoes.api.ts` - reescrita completa
- Import de `supabase` de `@/lib/supabase` em vez de `api` de `@/lib/api`

### Tratamento de erros
- Cada funcao verifica `error` do Supabase e lanca `Error` para o React Query capturar
- Toast de erro ja esta configurado nos hooks (Prompt 2)

### Funcionalidades com limitacao temporaria
- `integracoesApi.obterAuthUrl` e `processarCallback` - dependem de OAuth no backend, serao mantidos como stub com mensagem informativa
- `webhooksApi.testarSaida` - depende de chamada HTTP do backend, sera stub
- `equipeApi.convidarUsuario` e `reenviarConvite` - dependem de envio de email via backend, serao stub

## Ordem de Execucao
1. Criar migration SQL com novas politicas RLS (auth.uid)
2. Reescrever configuracoes.api.ts usando Supabase direto
3. Testar acesso as paginas de Pipeline (Campos, Motivos, etc.)
