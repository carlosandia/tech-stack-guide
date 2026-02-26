ALTER TABLE configuracoes_tenant
  ADD COLUMN IF NOT EXISTS horario_comercial_inicio text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS horario_comercial_fim text DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS dias_uteis smallint[] DEFAULT '{1,2,3,4,5}';