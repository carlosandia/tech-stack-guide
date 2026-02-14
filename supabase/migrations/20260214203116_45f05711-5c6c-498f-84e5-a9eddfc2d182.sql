-- AIDEV-NOTE: Habilitar REPLICA IDENTITY FULL para conversas_labels
-- Necessário para que Supabase Realtime envie dados da row deletada
-- permitindo que filtros como organizacao_id funcionem em eventos DELETE
ALTER TABLE public.conversas_labels REPLICA IDENTITY FULL;

-- Também para whatsapp_labels (para UPDATE/DELETE events)
ALTER TABLE public.whatsapp_labels REPLICA IDENTITY FULL;