-- Novas colunas na tabela assinaturas para cortesia temporizada
ALTER TABLE assinaturas 
  ADD COLUMN cortesia_duracao_meses integer,
  ADD COLUMN cortesia_inicio timestamptz,
  ADD COLUMN cortesia_fim timestamptz;

-- Funcao de verificacao de cortesias expiradas
CREATE OR REPLACE FUNCTION verificar_cortesias_expiradas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Atualizar assinaturas com cortesia expirada
  UPDATE assinaturas 
  SET status = 'bloqueada', cortesia = false
  WHERE cortesia = true 
    AND cortesia_fim IS NOT NULL 
    AND cortesia_fim < NOW()
    AND status != 'bloqueada';

  -- Atualizar organizacoes correspondentes
  UPDATE organizacoes_saas 
  SET status = 'suspensa'
  WHERE id IN (
    SELECT organizacao_id FROM assinaturas 
    WHERE cortesia_fim IS NOT NULL 
      AND cortesia_fim < NOW() 
      AND status = 'bloqueada'
  )
  AND status != 'suspensa';
END;
$$;