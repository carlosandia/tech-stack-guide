-- Tornar o bucket chat-media público para que URLs de mídia funcionem sem token
UPDATE storage.buckets SET public = true WHERE id = 'chat-media';

-- Adicionar política de leitura pública para objetos do bucket chat-media
CREATE POLICY "Chat media files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');
