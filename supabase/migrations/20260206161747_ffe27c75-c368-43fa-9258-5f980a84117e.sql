-- Adicionar policies RLS para checkout_sessions_pendentes
-- Esta tabela deve ser acessível apenas via service_role (edge functions)

-- Policy: Apenas service_role pode fazer todas as operações
CREATE POLICY "service_role_full_access" ON public.checkout_sessions_pendentes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Bloquear acesso público (authenticated e anon)
CREATE POLICY "block_authenticated_access" ON public.checkout_sessions_pendentes
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "block_anon_access" ON public.checkout_sessions_pendentes
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);