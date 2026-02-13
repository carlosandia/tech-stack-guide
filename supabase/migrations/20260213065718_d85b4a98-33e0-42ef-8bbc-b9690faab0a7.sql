
-- Criar bucket para avatars dos usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode VER avatars (público)
CREATE POLICY "Avatars são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Política: usuários autenticados podem fazer upload do próprio avatar
CREATE POLICY "Usuários podem fazer upload do próprio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuários podem atualizar o próprio avatar
CREATE POLICY "Usuários podem atualizar o próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: usuários podem deletar o próprio avatar
CREATE POLICY "Usuários podem deletar o próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
