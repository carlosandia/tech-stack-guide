-- Adicionar coluna audio_url aos templates de tarefas
ALTER TABLE public.tarefas_templates
ADD COLUMN audio_url TEXT DEFAULT NULL;

-- Adicionar coluna audio_url às tarefas (para cadência com áudio)
ALTER TABLE public.tarefas
ADD COLUMN audio_url TEXT DEFAULT NULL;