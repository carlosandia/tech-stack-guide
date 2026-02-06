-- Bucket para imagens de assinatura de mensagem
INSERT INTO storage.buckets (id, name, public)
VALUES ('assinaturas', 'assinaturas', true)
ON CONFLICT (id) DO NOTHING;

-- Qualquer usuário autenticado pode ver imagens de assinatura (bucket público)
CREATE POLICY "Imagens de assinatura são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'assinaturas');

-- Usuários autenticados podem fazer upload de imagens
CREATE POLICY "Usuários autenticados podem fazer upload de assinatura"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'assinaturas' AND auth.role() = 'authenticated');

-- Usuários autenticados podem deletar suas imagens
CREATE POLICY "Usuários autenticados podem deletar assinatura"
ON storage.objects FOR DELETE
USING (bucket_id = 'assinaturas' AND auth.role() = 'authenticated');