

# Correcao dos 3 Problemas Remanescentes de Seguranca

## Problema 1: Policies legadas com `app.current_tenant` (15 tabelas)

Foram encontradas **39 policies legadas** distribuidas em **15 tabelas** que usam `current_setting('app.current_tenant')`. Como essa variavel nao e definida via PostgREST/frontend, essas policies sao inoperantes e devem ser substituidas por `get_user_tenant_id()`.

**Tabelas afetadas:**
- `conexoes_email` (INSERT)
- `conexoes_google` (INSERT, UPDATE)
- `conexoes_instagram` (INSERT)
- `conexoes_meta` (INSERT)
- `config_conversions_api` (SELECT, INSERT, UPDATE, DELETE)
- `custom_audience_membros` (SELECT, INSERT, UPDATE, DELETE)
- `custom_audiences_meta` (SELECT, INSERT, UPDATE, DELETE)
- `duplicatas_contatos` (SELECT)
- `eventos_pendentes` (SELECT, INSERT, UPDATE)
- `formularios_lead_ads` (SELECT, INSERT, UPDATE, DELETE)
- `historico_distribuicao` (SELECT, INSERT)
- `importacoes_contatos` (SELECT)
- `integracoes` (SELECT, INSERT, UPDATE, DELETE)
- `log_conversions_api` (SELECT, INSERT)
- `paginas_meta` (SELECT, INSERT, UPDATE, DELETE)

**Acao:** Criar migracao SQL que dropa cada policy legada e recria com `get_user_tenant_id()`.

---

## Problema 2: URL e Anon Key hardcoded em FormularioPublicoPage.tsx

**Arquivo:** `src/modules/formularios/pages/FormularioPublicoPage.tsx` (linha 292-296)

Ainda existe uma chamada `fetch()` com URL e apikey hardcoded para a Edge Function `processar-submissao-formulario`.

**Acao:** Substituir por `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.

---

## Problema 3: Policy permissiva `WITH CHECK (true)` em webhooks_entrada_logs

**Tabela:** `webhooks_entrada_logs`

Existe uma policy `"Service role pode inserir logs"` com `WITH CHECK (true)` que permite qualquer usuario autenticado inserir logs falsos. Ja existe uma policy validada (`webhooks_entrada_logs_insert_validated`), entao a permissiva deve ser removida.

**Acao:** Dropar a policy `"Service role pode inserir logs"`.

---

## Detalhes Tecnicos

### Migracao SQL (1 arquivo)

A migracao contera ~150 linhas de SQL com o seguinte padrao para cada tabela:

```text
-- Para cada policy legada:
DROP POLICY IF EXISTS "nome_policy" ON tabela;
CREATE POLICY "nome_policy_v2" ON tabela FOR [SELECT|INSERT|UPDATE|DELETE]
  [USING | WITH CHECK] (organizacao_id = get_user_tenant_id());
```

Para tabelas com joins indiretos (como `custom_audience_membros`, `equipes_membros`), a policy usara subquery:

```text
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
))
```

### Alteracao no Frontend (1 arquivo)

`FormularioPublicoPage.tsx` - linhas 292-296: substituir URL e apikey hardcoded por variaveis de ambiente.

### Arquivos modificados

1. Nova migracao SQL (policies legadas + webhook)
2. `src/modules/formularios/pages/FormularioPublicoPage.tsx` (URL hardcoded)

