-- Adicionar campos para suporte a blocos de colunas (Elementor-style)
-- pai_campo_id: referencia ao bloco_colunas que contém este campo
-- coluna_indice: em qual coluna (0-based) o campo está posicionado

ALTER TABLE public.campos_formularios
ADD COLUMN pai_campo_id uuid REFERENCES public.campos_formularios(id) ON DELETE CASCADE,
ADD COLUMN coluna_indice integer;

-- Índice para buscar campos filhos de um bloco rapidamente
CREATE INDEX idx_campos_formularios_pai ON public.campos_formularios(pai_campo_id) WHERE pai_campo_id IS NOT NULL;