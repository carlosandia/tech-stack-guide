
-- Fix search_path for new functions
ALTER FUNCTION recalcular_progresso_meta(uuid) SET search_path = public;
ALTER FUNCTION trg_recalcular_metas_oportunidade() SET search_path = public;
