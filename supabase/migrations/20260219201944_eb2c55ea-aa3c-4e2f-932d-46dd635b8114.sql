
-- =============================================================
-- AUDITORIA DE SEGURANÇA - Fase 1: Correções Críticas e Altas
-- =============================================================

-- C4: Remover policies legadas com app.current_tenant (inoperantes via PostgREST)
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_email;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_email;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_google;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_google;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_meta;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_meta;
DROP POLICY IF EXISTS "tenant_isolation" ON conexoes_instagram;
DROP POLICY IF EXISTS "tenant_delete" ON conexoes_instagram;

-- C4: Adicionar DELETE policies baseadas em auth.uid()
CREATE POLICY "tenant_delete_v2" ON conexoes_email FOR DELETE
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
));

CREATE POLICY "tenant_delete_v2" ON conexoes_google FOR DELETE
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
));

CREATE POLICY "tenant_delete_v2" ON conexoes_meta FOR DELETE
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
));

CREATE POLICY "tenant_delete_v2" ON conexoes_instagram FOR DELETE
USING (organizacao_id IN (
  SELECT organizacao_id FROM usuarios WHERE auth_id = auth.uid()
));

-- A1: Restringir SELECT público de planos/modulos (apenas autenticados)
DROP POLICY IF EXISTS "modulos_select_public" ON modulos;
DROP POLICY IF EXISTS "planos_select_public" ON planos;
DROP POLICY IF EXISTS "planos_modulos_select_public" ON planos_modulos;

-- A1: Permitir SELECT para autenticados + anon (página pública de planos precisa)
-- Mantemos acesso para anon pois a página /planos é pública, mas removemos
-- campos sensíveis via view restrita para admin
CREATE POLICY "planos_select_authenticated_or_anon" ON planos FOR SELECT
USING (ativo = true AND visivel = true);

CREATE POLICY "planos_select_admin" ON planos FOR SELECT
USING (public.is_super_admin_v2());

CREATE POLICY "modulos_select_authenticated" ON modulos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "planos_modulos_select_authenticated" ON planos_modulos FOR SELECT
USING (auth.uid() IS NOT NULL);

-- A3: Adicionar policy de SELECT na sessoes_impersonacao para super_admin
CREATE POLICY "sessoes_impersonacao_select_super_admin" ON sessoes_impersonacao FOR SELECT
USING (public.is_super_admin_v2());

-- A4: Corrigir INSERT policy do webhooks_entrada_logs
DROP POLICY IF EXISTS "webhooks_entrada_logs_insert" ON webhooks_entrada_logs;
-- Manter INSERT aberto para edge functions (service_role) mas sem WITH CHECK true direto
-- Edge functions usam service_role, então não precisam de policy
-- Para usuários autenticados, validar organizacao_id
CREATE POLICY "webhooks_entrada_logs_insert_validated" ON webhooks_entrada_logs FOR INSERT
WITH CHECK (
  organizacao_id = public.get_user_tenant_id()
  OR auth.uid() IS NULL -- permite inserts de service_role/anon (webhooks externos)
);

-- A5: Restringir INSERT no audit_log - apenas SECURITY DEFINER functions devem inserir
DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
-- Não criar nova policy de INSERT para usuários comuns
-- Triggers com SECURITY DEFINER continuam funcionando normalmente
