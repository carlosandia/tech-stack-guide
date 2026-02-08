-- Adicionar campos para configuração de pré-oportunidades automáticas via WhatsApp
ALTER TABLE public.sessoes_whatsapp 
  ADD COLUMN IF NOT EXISTS funil_destino_id uuid REFERENCES public.funis(id),
  ADD COLUMN IF NOT EXISTS auto_criar_pre_oportunidade boolean DEFAULT false;