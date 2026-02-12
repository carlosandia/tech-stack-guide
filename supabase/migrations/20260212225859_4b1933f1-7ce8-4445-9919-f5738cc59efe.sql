
-- Inserir configuracao de login_banner na tabela existente
INSERT INTO public.configuracoes_globais (plataforma, configuracoes, configurado)
VALUES (
  'login_banner',
  '{"desktop_image_url": "", "tablet_image_url": "", "mobile_image_url": "", "link_url": "", "background_color": "#F8FAFC"}'::jsonb,
  false
)
ON CONFLICT DO NOTHING;

-- Criar bucket publico para login-banner
INSERT INTO storage.buckets (id, name, public)
VALUES ('login-banner', 'login-banner', true)
ON CONFLICT DO NOTHING;

-- RLS policy: anon pode ler login_banner
CREATE POLICY "anon_read_login_banner"
ON public.configuracoes_globais
FOR SELECT
TO anon
USING (plataforma = 'login_banner');

-- Storage policies para login-banner
CREATE POLICY "Login banner images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'login-banner');

CREATE POLICY "Super admins can upload login banner"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'login-banner' AND public.is_super_admin());

CREATE POLICY "Super admins can update login banner"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'login-banner' AND public.is_super_admin());

CREATE POLICY "Super admins can delete login banner"
ON storage.objects
FOR DELETE
USING (bucket_id = 'login-banner' AND public.is_super_admin());
