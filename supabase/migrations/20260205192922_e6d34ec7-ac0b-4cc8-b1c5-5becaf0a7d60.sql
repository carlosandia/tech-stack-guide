-- Corrigir search_path da funcao verificar_cortesias_expiradas
CREATE OR REPLACE FUNCTION verificar_cortesias_expiradas()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
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