-- Tabela para rastrear sessões de checkout pendentes
CREATE TABLE IF NOT EXISTS checkout_sessions_pendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  plano_id UUID REFERENCES planos(id),
  is_trial BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pendente',
  metadata JSONB,
  criado_em TIMESTAMPTZ DEFAULT now(),
  concluido_em TIMESTAMPTZ
);

-- Index para buscas rápidas
CREATE INDEX idx_checkout_sessions_stripe_id ON checkout_sessions_pendentes(stripe_session_id);
CREATE INDEX idx_checkout_sessions_status ON checkout_sessions_pendentes(status);

-- RLS: apenas service_role pode acessar (sem policies públicas)
ALTER TABLE checkout_sessions_pendentes ENABLE ROW LEVEL SECURITY;

-- Comentário na tabela
COMMENT ON TABLE checkout_sessions_pendentes IS 'Rastreia sessões de checkout do Stripe aguardando finalização do onboarding';