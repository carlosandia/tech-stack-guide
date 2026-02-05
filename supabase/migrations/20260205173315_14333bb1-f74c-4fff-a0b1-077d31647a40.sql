-- Atualizar constraint de status para incluir 'trial'
ALTER TABLE organizacoes_saas DROP CONSTRAINT chk_status;

ALTER TABLE organizacoes_saas 
ADD CONSTRAINT chk_status CHECK (
  status IN ('ativo', 'trial', 'suspenso', 'cancelado')
);