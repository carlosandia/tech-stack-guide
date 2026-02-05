-- Deletar assinaturas da organização Renove Digital
DELETE FROM assinaturas WHERE organizacao_id = 'b96487a9-ca8d-4a23-90bd-8c7f0ab3ae59';

-- Deletar usuários da organização
DELETE FROM usuarios WHERE organizacao_id = 'b96487a9-ca8d-4a23-90bd-8c7f0ab3ae59';

-- Deletar a organização
DELETE FROM organizacoes_saas WHERE id = 'b96487a9-ca8d-4a23-90bd-8c7f0ab3ae59';