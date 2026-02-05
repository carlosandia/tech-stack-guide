
-- Remover assinatura da organizacao Renove Digital
DELETE FROM assinaturas WHERE organizacao_id = '044e60fa-7335-46e9-8622-9e39785f1e96';

-- Remover audit_log relacionado
DELETE FROM audit_log WHERE organizacao_id = '044e60fa-7335-46e9-8622-9e39785f1e96';

-- Remover usuario admin Carlos Andia
DELETE FROM usuarios WHERE id = '2118c462-5240-4f1f-ab88-07ba228c9a0a';

-- Remover organizacao Renove Digital
DELETE FROM organizacoes_saas WHERE id = '044e60fa-7335-46e9-8622-9e39785f1e96';
