
-- Remover dados vinculados à organização LitoralPlace (ae76ee0e-bed5-46d2-b39c-d27f9915dd76)

-- Campos customizados
DELETE FROM campos_customizados WHERE organizacao_id = 'ae76ee0e-bed5-46d2-b39c-d27f9915dd76';

-- Assinaturas
DELETE FROM assinaturas WHERE organizacao_id = 'ae76ee0e-bed5-46d2-b39c-d27f9915dd76';

-- Usuários da organização
DELETE FROM usuarios WHERE organizacao_id = 'ae76ee0e-bed5-46d2-b39c-d27f9915dd76';

-- Organização
DELETE FROM organizacoes_saas WHERE id = 'ae76ee0e-bed5-46d2-b39c-d27f9915dd76';

-- Remover usuário do auth.users
DELETE FROM auth.users WHERE id = 'b44ae43f-f6fc-4742-b824-9230ef16dd67';
