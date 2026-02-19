
## Correção: Erro 400 ao salvar formulário Lead Ads

### Causa Raiz

A tabela `paginas_meta` está **vazia**. O campo `pagina_id` em `formularios_lead_ads` é `uuid NOT NULL` com FK para `paginas_meta.id`. O código recebe o Page ID do Facebook (string numérica como "123456789") da seleção do dropdown, tenta um lookup na `paginas_meta` (que retorna vazio), e insere essa string numérica como UUID, causando o erro 400 (Bad Request).

### Solucao

Na função `criarFormulario`, antes de inserir em `formularios_lead_ads`, fazer **upsert** na tabela `paginas_meta` para garantir que a página existe. Usar os dados já disponíveis no payload (page_id, page_name) e o `integracaoId` como `conexao_id`.

### Alteracoes

**Arquivo:** `src/modules/configuracoes/components/integracoes/meta/LeadAdsFormMappingModal.tsx`

1. Passar `integracaoId` (conexao_id) no payload enviado ao `salvar.mutate()`, junto com `page_name` (nome da página selecionada):

```typescript
const payload = {
  form_id: selectedFormId,
  form_name: selectedFormName,
  page_id: selectedPageId || form?.page_id,
  page_name: selectedPageName, // novo campo
  conexao_id: _integracaoId,   // novo campo (era ignorado com _)
  pipeline_id: selectedPipelineId,
  etapa_id: etapaInicial?.id || '',
  mapeamento_campos: mappings.filter((m) => m.crm_field),
}
```

2. Adicionar state `selectedPageName` para capturar o nome da página ao selecionar.

**Arquivo:** `src/modules/configuracoes/services/configuracoes.api.ts`

3. Na função `criarFormulario`, substituir o lookup simples por um **upsert** na `paginas_meta`:

```typescript
// Upsert na paginas_meta para garantir que a página existe
const { data: paginaMeta, error: errPagina } = await supabase
  .from('paginas_meta')
  .upsert({
    organizacao_id: orgId,
    conexao_id: payload.conexao_id,
    page_id: facebookPageId,
    page_name: payload.page_name || 'Página Facebook',
  }, { onConflict: 'organizacao_id,page_id' })
  .select('id')
  .single()

if (errPagina) throw errPagina
const paginaUuid = paginaMeta.id
```

4. Se não existir constraint unique em `(organizacao_id, page_id)`, fazer busca + insert condicional como fallback.

### Verificacao necessaria

Confirmar se existe constraint unique em `paginas_meta(organizacao_id, page_id)`. Caso não exista, criar via migration.

### Resultado esperado

- A página do Facebook é registrada automaticamente em `paginas_meta` ao configurar o formulário
- O UUID correto é usado em `formularios_lead_ads.pagina_id`
- O erro 400 desaparece
