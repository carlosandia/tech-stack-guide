-- Adicionar 'so_imagem' ao check constraint de popup_imagem_posicao
ALTER TABLE config_popup_formularios DROP CONSTRAINT config_popup_formularios_popup_imagem_posicao_check;
ALTER TABLE config_popup_formularios ADD CONSTRAINT config_popup_formularios_popup_imagem_posicao_check
  CHECK (popup_imagem_posicao IS NULL OR popup_imagem_posicao IN ('so_campos', 'imagem_esquerda', 'imagem_direita', 'imagem_topo', 'imagem_fundo', 'imagem_lateral_full', 'so_imagem'));

-- Corrigir check constraint de posicao para aceitar os valores usados no frontend
ALTER TABLE config_popup_formularios DROP CONSTRAINT config_popup_formularios_posicao_check;
ALTER TABLE config_popup_formularios ADD CONSTRAINT config_popup_formularios_posicao_check
  CHECK (posicao IN ('centro', 'topo', 'inferior_direito', 'inferior_esquerdo', 'lateral_direita', 'topo_direita', 'baixo_direita', 'baixo_esquerda', 'topo_esquerda'));

-- Corrigir check constraint de tipo_gatilho
ALTER TABLE config_popup_formularios DROP CONSTRAINT config_popup_formularios_tipo_gatilho_check;
ALTER TABLE config_popup_formularios ADD CONSTRAINT config_popup_formularios_tipo_gatilho_check
  CHECK (tipo_gatilho IN ('intencao_saida', 'tempo', 'scroll', 'clique', 'atraso_tempo', 'porcentagem_scroll'));

-- Corrigir check constraint de tipo_animacao
ALTER TABLE config_popup_formularios DROP CONSTRAINT config_popup_formularios_tipo_animacao_check;
ALTER TABLE config_popup_formularios ADD CONSTRAINT config_popup_formularios_tipo_animacao_check
  CHECK (tipo_animacao IS NULL OR tipo_animacao IN ('fade', 'slide_up', 'slide_down', 'scale', 'none', 'slide_cima', 'slide_baixo', 'zoom', 'nenhum'));