
-- Criar bucket para documentos de oportunidades
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos-oportunidades', 'documentos-oportunidades', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket (RLS)
-- Usuários autenticados podem fazer upload de documentos da sua organização
CREATE POLICY "Usuarios podem ver documentos da org"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos-oportunidades'
  AND (storage.foldername(name))[1] IN (
    SELECT o.organizacao_id::text FROM public.usuarios u
    JOIN public.oportunidades o ON o.organizacao_id = u.organizacao_id
    WHERE u.auth_id = auth.uid()
    LIMIT 1
  )
);

CREATE POLICY "Usuarios podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos-oportunidades'
  AND (storage.foldername(name))[1] IN (
    SELECT u.organizacao_id::text FROM public.usuarios u
    WHERE u.auth_id = auth.uid()
  )
);

CREATE POLICY "Usuarios podem deletar documentos da org"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos-oportunidades'
  AND (storage.foldername(name))[1] IN (
    SELECT u.organizacao_id::text FROM public.usuarios u
    WHERE u.auth_id = auth.uid()
  )
);
