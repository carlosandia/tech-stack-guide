
-- Criar bucket público para imagens de formulários (popups, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('formularios', 'formularios', true)
ON CONFLICT (id) DO NOTHING;

-- Permitir upload por usuários autenticados
CREATE POLICY "Authenticated users can upload formulario images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'formularios');

-- Permitir leitura pública (bucket é público)
CREATE POLICY "Anyone can view formulario images"
ON storage.objects FOR SELECT
USING (bucket_id = 'formularios');

-- Permitir delete pelo owner
CREATE POLICY "Users can delete own formulario images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'formularios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir update pelo owner
CREATE POLICY "Users can update own formulario images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'formularios' AND auth.uid()::text = (storage.foldername(name))[1]);
