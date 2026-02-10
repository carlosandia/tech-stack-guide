-- Atualizar total_submissoes para formulários existentes
UPDATE formularios SET total_submissoes = (
  SELECT count(*) FROM submissoes_formularios WHERE formulario_id = formularios.id
);