
-- GAP 1: Policy de UPDATE para feedbacks (Super Admin resolver feedback)
CREATE POLICY "super_admin_update_feedback" ON public.feedbacks
  FOR UPDATE
  USING (public.is_super_admin_v2());

-- GAP 2: Ajustar policies de notificacoes
-- Dropar policy FOR ALL existente que bloqueia INSERT do Super Admin
DROP POLICY IF EXISTS "usuario_proprias_notificacoes" ON public.notificacoes;

-- Recriar SELECT: usuario le suas proprias notificacoes
CREATE POLICY "usuario_ler_notificacoes" ON public.notificacoes
  FOR SELECT
  USING (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid() LIMIT 1
    )
  );

-- UPDATE: usuario marca como lida suas proprias notificacoes
CREATE POLICY "usuario_atualizar_notificacoes" ON public.notificacoes
  FOR UPDATE
  USING (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid() LIMIT 1
    )
  );

-- INSERT: usuario pode criar para si OU super_admin pode criar para qualquer usuario
CREATE POLICY "inserir_notificacao" ON public.notificacoes
  FOR INSERT
  WITH CHECK (
    usuario_id = (
      SELECT u.id FROM public.usuarios u WHERE u.auth_id = auth.uid() LIMIT 1
    )
    OR
    public.is_super_admin_v2()
  );
