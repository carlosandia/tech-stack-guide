
ALTER TABLE config_popup_formularios DROP CONSTRAINT config_popup_formularios_popup_imagem_posicao_check;

ALTER TABLE config_popup_formularios ADD CONSTRAINT config_popup_formularios_popup_imagem_posicao_check
  CHECK (popup_imagem_posicao IS NULL OR popup_imagem_posicao::text = ANY(ARRAY['so_campos', 'imagem_esquerda', 'imagem_direita', 'imagem_topo', 'imagem_fundo', 'imagem_lateral_full']::text[]));
