-- Adicionar coluna popup_imagem_link na tabela config_popup_formularios
-- Para link clicável na imagem do popup (aplica a todos os layouts com imagem)
ALTER TABLE public.config_popup_formularios
ADD COLUMN popup_imagem_link text DEFAULT NULL;