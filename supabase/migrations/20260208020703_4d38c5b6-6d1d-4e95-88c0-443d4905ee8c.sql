
-- =====================================================
-- Bucket para áudios de anotações
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('anotacoes-audio', 'anotacoes-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para anotacoes-audio
CREATE POLICY "Usuarios autenticados podem fazer upload de audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'anotacoes-audio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuarios autenticados podem ler audios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'anotacoes-audio'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Usuarios autenticados podem deletar seus audios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'anotacoes-audio'
  AND auth.role() = 'authenticated'
);

-- =====================================================
-- Novas colunas em reunioes_oportunidades
-- =====================================================
ALTER TABLE reunioes_oportunidades
ADD COLUMN IF NOT EXISTS tipo varchar DEFAULT 'video',
ADD COLUMN IF NOT EXISTS participantes jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS google_meet_link text,
ADD COLUMN IF NOT EXISTS notificacao_minutos integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
ADD COLUMN IF NOT EXISTS realizada_em timestamptz,
ADD COLUMN IF NOT EXISTS cancelada_em timestamptz,
ADD COLUMN IF NOT EXISTS observacoes_realizacao text,
ADD COLUMN IF NOT EXISTS observacoes_noshow text;
