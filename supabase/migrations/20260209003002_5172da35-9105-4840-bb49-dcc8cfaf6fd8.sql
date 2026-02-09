
-- Create chat-media bucket for audio recordings, camera captures, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Allow public read access
CREATE POLICY "Anyone can view chat media"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update chat media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-media');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');
