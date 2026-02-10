-- Permitir criado_por_id NULL em tarefas (quando criado via Edge Function sem contexto de usuario)
ALTER TABLE public.tarefas ALTER COLUMN criado_por_id DROP NOT NULL;