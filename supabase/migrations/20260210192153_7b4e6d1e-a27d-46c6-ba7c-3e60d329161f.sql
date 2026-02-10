-- Permitir owner_id NULL em tarefas (quando rodizio nao atribui responsavel)
ALTER TABLE public.tarefas ALTER COLUMN owner_id DROP NOT NULL;