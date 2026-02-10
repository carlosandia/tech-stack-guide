
-- Corrigir policies de UPDATE e DELETE do bucket formularios
-- O path usa formularioId como pasta, não auth.uid()
-- Ajustar para permitir qualquer usuário autenticado

DROP POLICY IF EXISTS "Users can update own formulario images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own formulario images" ON storage.objects;

CREATE POLICY "Authenticated users can update formulario images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'formularios' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete formulario images"
ON storage.objects FOR DELETE
USING (bucket_id = 'formularios' AND auth.role() = 'authenticated');
