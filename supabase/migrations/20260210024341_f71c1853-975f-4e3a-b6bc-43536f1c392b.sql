
ALTER TABLE config_popup_formularios ALTER COLUMN popup_imagem_posicao SET DEFAULT 'so_campos';

-- Also update any existing rows with old values
UPDATE config_popup_formularios SET popup_imagem_posicao = 'so_campos' WHERE popup_imagem_posicao IS NULL OR popup_imagem_posicao NOT IN ('so_campos', 'imagem_esquerda', 'imagem_direita', 'imagem_topo', 'imagem_fundo', 'imagem_lateral_full');
