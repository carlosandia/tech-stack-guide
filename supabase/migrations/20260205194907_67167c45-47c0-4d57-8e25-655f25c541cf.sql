
-- Remover assinatura da organização Renove Digital
DELETE FROM assinaturas WHERE organizacao_id = 'c0581988-0574-46ef-8759-055c9f07fdbf';

-- Remover usuário administrador
DELETE FROM usuarios WHERE id = 'f3c45b0b-c702-426a-b2f4-227f27d905ee';

-- Remover organização
DELETE FROM organizacoes_saas WHERE id = 'c0581988-0574-46ef-8759-055c9f07fdbf';

-- Limpar audit_log relacionado (opcional)
DELETE FROM audit_log WHERE organizacao_id = 'c0581988-0574-46ef-8759-055c9f07fdbf';
