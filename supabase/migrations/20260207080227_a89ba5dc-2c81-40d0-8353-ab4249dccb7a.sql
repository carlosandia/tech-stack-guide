-- Remover constraint que obriga razao_social para empresas
-- A obrigatoriedade agora é controlada pela configuração global de campos
ALTER TABLE public.contatos DROP CONSTRAINT IF EXISTS chk_empresa_razao;