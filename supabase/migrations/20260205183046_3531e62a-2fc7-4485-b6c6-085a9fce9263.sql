
-- Deletar expectativas da organização
DELETE FROM organizacoes_expectativas WHERE organizacao_id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';

-- Deletar módulos da organização
DELETE FROM organizacoes_modulos WHERE organizacao_id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';

-- Deletar usuários da organização
DELETE FROM usuarios WHERE organizacao_id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';

-- Deletar assinaturas da organização
DELETE FROM assinaturas WHERE organizacao_id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';

-- Deletar configurações tenant
DELETE FROM configuracoes_tenant WHERE organizacao_id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';

-- Deletar a organização
DELETE FROM organizacoes_saas WHERE id = 'd7752e2c-ff06-4d15-8a36-6143b38c3680';
