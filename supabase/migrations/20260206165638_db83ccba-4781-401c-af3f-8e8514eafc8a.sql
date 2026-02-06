-- Adicionar policies baseadas em auth.uid() para conexoes_email
-- As policies atuais usam app.current_tenant que não é setado pelo frontend

-- Policy SELECT: usuário pode ver conexões da sua organização
CREATE POLICY "users_select_own_org_email" ON public.conexoes_email
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

-- Repetir para as outras tabelas de conexões que têm o mesmo problema

-- conexoes_google
CREATE POLICY "users_select_own_org_google" ON public.conexoes_google
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

-- conexoes_instagram
CREATE POLICY "users_select_own_org_instagram" ON public.conexoes_instagram
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

-- conexoes_meta
CREATE POLICY "users_select_own_org_meta" ON public.conexoes_meta
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);

-- sessoes_whatsapp (usado no listar de integrações)
CREATE POLICY "users_select_own_org_whatsapp" ON public.sessoes_whatsapp
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.usuarios WHERE auth_id = auth.uid()
  )
);