
# Auditoria de Seguranca Completa - CRM Renove

## Resumo Executivo

Foram identificados **14 problemas de seguranca** distribuidos em 4 niveis de severidade:
- **4 Criticos** (correcao imediata)
- **5 Altos** (correcao antes da auditoria)
- **3 Medios** (recomendado corrigir)
- **2 Baixos** (melhorias progressivas)

---

## CRITICOS (Correcao Imediata)

### C1. dangerouslySetInnerHTML sem DOMPurify em renderFinalCampo.tsx
**Arquivo:** `src/modules/formularios/utils/renderFinalCampo.tsx` (linha 269)
**Problema:** O campo `bloco_html` renderiza HTML sem sanitizacao, permitindo ataques XSS.
**Codigo vulneravel:**
```typescript
dangerouslySetInnerHTML={{ __html: campo.valor_padrao || '<p>Bloco HTML</p>' }}
```
**Correcao:** Adicionar `DOMPurify.sanitize()` ao redor do valor.

### C2. dangerouslySetInnerHTML sem DOMPurify em AbaEmail.tsx
**Arquivo:** `src/modules/negocios/components/detalhes/AbaEmail.tsx` (linha 210)
**Problema:** Corpo de email renderizado sem sanitizacao. Emails maliciosos podem executar scripts.
**Codigo vulneravel:**
```typescript
dangerouslySetInnerHTML={{ __html: email.corpo || '<p>(Sem conteudo)</p>' }}
```
**Correcao:** Adicionar `DOMPurify.sanitize()`.

### C3. Tabela `conexoes_email` expoe tokens/senhas criptografados via SELECT
**Problema:** Politicas de RLS permitem SELECT de campos `access_token_encrypted`, `refresh_token_encrypted`, `senha_app_encrypted` para qualquer usuario do tenant. Mesmo criptografados, a exposicao aumenta a superficie de ataque.
**Correcao:** Criar uma VIEW que exclua campos sensveis e restringir SELECT na tabela base. Alternativamente, remover os campos `*_encrypted` das queries do frontend.

### C4. Politicas RLS com `app.current_tenant` (inuteis via PostgREST)
**Problema:** Tabelas `conexoes_email`, `conexoes_google`, `conexoes_meta`, `conexoes_instagram` possuem policies `tenant_isolation` e `tenant_delete` que dependem de `current_setting('app.current_tenant')`. Essa variavel nao e definida via PostgREST/frontend, tornando essas policies inoperantes.
**Correcao:** Remover essas policies legadas e garantir que as policies baseadas em `auth.uid()` cubram todos os comandos.

---

## ALTOS (Correcao Antes da Auditoria)

### A1. Tabelas `planos`, `planos_modulos`, `modulos` com SELECT publico (`true`)
**Problema:** Qualquer pessoa (anonima) pode ler toda a estrategia de precos, Stripe Price IDs e modulos do sistema.
**Correcao:** Remover `qual: true` policies e restringir a `auth.uid() IS NOT NULL` ou criar endpoint publico limitado.

### A2. Leaked Password Protection desabilitado
**Problema:** O Supabase Auth nao verifica se a senha do usuario esta em listas de vazamentos conhecidos (HaveIBeenPwned).
**Correcao:** Ativar em Supabase Dashboard > Authentication > Settings > Password Security > Enable leaked password protection.

### A3. Tabela `sessoes_impersonacao` com RLS ativado mas sem policies
**Problema:** RLS esta habilitado mas nenhuma policy foi criada, impedindo qualquer operacao via frontend (mas as edge functions com service_role funcionam). Necessario adicionar policy de SELECT para super_admin consultar sessoes.

### A4. Tabela `webhooks_entrada_logs` com INSERT `WITH CHECK (true)`
**Problema:** Qualquer usuario autenticado pode inserir logs falsos nos webhooks. Deveria validar organizacao_id do usuario.
**Correcao:** Alterar WITH CHECK para validar `organizacao_id = get_user_tenant_id()`.

### A5. Tabela `audit_log` permite INSERT sem validacao de organizacao
**Problema:** Qualquer usuario autenticado pode inserir entradas no audit_log de qualquer organizacao, permitindo falsificacao de registros de auditoria.
**Correcao:** Restringir INSERT no audit_log para apenas triggers (SECURITY DEFINER functions) ou validar organizacao_id.

---

## MEDIOS (Recomendado Corrigir)

### M1. URLs do Supabase hardcoded em 10+ arquivos do frontend
**Arquivos afetados:**
- `src/modules/admin/services/admin.api.ts` (4 ocorrencias)
- `src/modules/formularios/pages/FormularioPublicoPage.tsx`
- `src/modules/formularios/components/compartilhar/EmbedCodeCard.tsx`
- `src/modules/configuracoes/services/configuracoes.api.ts` (3 ocorrencias)
- `src/modules/configuracoes/components/whatsapp-widget/generateWidgetScript.ts`
- `src/modules/auth/pages/ForgotPasswordPage.tsx`
- `src/modules/automacoes/components/panels/WebhookDebugPanel.tsx`
- `src/modules/public/pages/PlanosPage.tsx`

**Problema:** Se o projeto Supabase mudar, sera necessario alterar dezenas de arquivos. Tambem expoe a URL do projeto desnecessariamente em codigo frontend.
**Correcao:** Centralizar em `import.meta.env.VITE_SUPABASE_URL` ou usar `supabase.functions.invoke()` ao inves de `fetch()` direto.

### M2. Anon Key hardcoded em `src/modules/formularios/pages/FormularioPublicoPage.tsx`
**Linha 215:** Anon key esta duplicada em texto plano. Embora a anon key seja publica por design, o hardcode dificulta manutencao e pode causar confusao em auditorias.
**Correcao:** Usar `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`.

### M3. Console.log com dados potencialmente sensiveis
**Arquivos:** `src/modules/configuracoes/services/configuracoes.api.ts` (linhas 1411-1426)
**Problema:** Logs de SMTP (email/senha) podem aparecer no console do navegador em producao.
**Correcao:** Remover ou condicionar a `import.meta.env.DEV`.

---

## BAIXOS (Melhorias Progressivas)

### B1. Tokens OAuth podem nao ter criptografia real (AES-256)
**Problema identificado anteriormente:** Campos `*_encrypted` podem estar usando apenas base64.
**Recomendacao:** Implementar criptografia AES-GCM com ENCRYPTION_KEY como secret.

### B2. Rate limiting ausente em endpoints publicos
**Endpoints:** `processar-submissao-formulario`, `widget-whatsapp-config POST`
**Recomendacao:** Implementar rate limit por IP usando tabela `rate_limits_formularios` que ja existe.

---

## Plano de Correcao

### Fase 1 - Correcoes Imediatas (Criticos + Altos)
1. Adicionar `DOMPurify.sanitize()` nos 2 pontos de XSS (C1, C2)
2. Remover policies RLS legadas com `app.current_tenant` (C4)
3. Criar VIEW para `conexoes_email` sem campos encrypted (C3)
4. Restringir SELECT publico de `planos`/`modulos` (A1)
5. Adicionar policy de SELECT na `sessoes_impersonacao` (A3)
6. Corrigir INSERT policy do `audit_log` e `webhooks_entrada_logs` (A4, A5)

### Fase 2 - Limpeza de Codigo (Medios)
7. Centralizar URL Supabase hardcoded (M1)
8. Remover anon key hardcoded (M2)
9. Remover console.log sensiveis (M3)

### Fase 3 - Manual (Requer Acao do Desenvolvedor)
10. Ativar Leaked Password Protection no Dashboard Supabase (A2)

## Detalhes Tecnicos das Migracoes SQL

### Para C4 (Remover policies legadas):
```sql
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_email;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_email;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_google;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_google;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_meta;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_meta;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_instagram;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_instagram;

-- Adicionar DELETE policies baseadas em auth.uid()
CREATE POLICY "tenant_delete_v2" ON conexoes_email FOR DELETE
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
));
-- (repetir para as demais tabelas)
```

### Para A1 (Restringir planos/modulos):
```sql
DROP POLICY IF EXISTS "modulos_select_public" ON modulos;
DROP POLICY IF EXISTS "planos_select_public" ON planos;
DROP POLICY IF EXISTS "planos_modulos_select_public" ON planos_modulos;
```

### Para A5 (Audit log INSERT):
```sql
-- Revogar INSERT direto - apenas triggers devem inserir
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
-- Nenhuma policy de INSERT para usuarios comuns
-- Triggers com SECURITY DEFINER continuam funcionando
```
