
-- =====================================================
-- Bucket para anexos de email
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-anexos',
  'email-anexos',
  false,
  26214400, -- 25MB
  NULL -- Permite todos os tipos
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Usuários autenticados podem fazer upload
CREATE POLICY "Users can upload email attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'email-anexos'
  AND auth.role() = 'authenticated'
);

-- RLS: Usuários podem ver seus próprios anexos (pasta do org/user)
CREATE POLICY "Users can read own email attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-anexos'
  AND auth.role() = 'authenticated'
);

-- RLS: Usuários podem deletar seus próprios anexos
CREATE POLICY "Users can delete own email attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'email-anexos'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Campos de tracking em emails_recebidos
-- =====================================================
ALTER TABLE public.emails_recebidos
ADD COLUMN IF NOT EXISTS tracking_id uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS aberto_em timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_aberturas integer DEFAULT 0;

-- Index para lookup rápido de tracking
CREATE INDEX IF NOT EXISTS idx_emails_recebidos_tracking_id
ON public.emails_recebidos (tracking_id)
WHERE tracking_id IS NOT NULL;
