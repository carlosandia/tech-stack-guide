
-- Tornar buckets sensíveis privados
UPDATE storage.buckets SET public = false WHERE id IN ('assinaturas', 'chat-media');

-- Remover políticas antigas permissivas do bucket 'assinaturas'
DROP POLICY IF EXISTS "Imagens de assinatura são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload de assinatura" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar assinatura" ON storage.objects;

-- Remover políticas antigas permissivas do bucket 'chat-media'
DROP POLICY IF EXISTS "Chat media is publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update chat media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete chat media" ON storage.objects;

-- Políticas tenant-scoped para 'assinaturas'
CREATE POLICY "Tenant users can view own org signatures" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'assinaturas'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can upload own org signatures" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assinaturas'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can delete own org signatures" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'assinaturas'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

-- Políticas tenant-scoped para 'chat-media'
CREATE POLICY "Tenant users can view own org chat media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can upload own org chat media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can update own org chat media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Tenant users can delete own org chat media" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] IN (
      SELECT organizacao_id::text FROM public.usuarios WHERE auth_id = auth.uid()
    )
  );
