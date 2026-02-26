ALTER TABLE configuracoes_tenant
  ADD COLUMN IF NOT EXISTS assinatura_incluir_novos boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS assinatura_incluir_respostas boolean NOT NULL DEFAULT true;