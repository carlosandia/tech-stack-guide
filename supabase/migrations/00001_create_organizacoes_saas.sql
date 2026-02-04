-- Migration: 00001_create_organizacoes_saas
-- Descricao: Tabela de organizacoes (tenants) do SaaS
-- AIDEV-NOTE: Tabela fundamental do modelo multi-tenant

-- Habilita extensao UUID se nao existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum de status da organizacao
CREATE TYPE organizacao_status AS ENUM ('trial', 'ativa', 'suspensa', 'cancelada');

-- Enum de planos
CREATE TYPE plano_tipo AS ENUM ('trial', 'starter', 'professional', 'enterprise');

-- Tabela principal de organizacoes (tenants)
CREATE TABLE IF NOT EXISTS organizacoes_saas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dados basicos
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  documento VARCHAR(20), -- CNPJ ou CPF
  email_contato VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  endereco TEXT,
  logo_url TEXT,

  -- Configuracoes de plano
  plano plano_tipo NOT NULL DEFAULT 'trial',
  status organizacao_status NOT NULL DEFAULT 'trial',
  limite_usuarios INTEGER NOT NULL DEFAULT 5,
  limite_contatos INTEGER NOT NULL DEFAULT 1000,

  -- Trial
  trial_inicio TIMESTAMPTZ,
  trial_fim TIMESTAMPTZ,

  -- Timestamps padrao
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ -- soft delete
);

-- Indice para busca por slug
CREATE INDEX idx_organizacoes_slug ON organizacoes_saas(slug) WHERE deletado_em IS NULL;

-- Indice para busca por status
CREATE INDEX idx_organizacoes_status ON organizacoes_saas(status) WHERE deletado_em IS NULL;

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizacoes_atualizado_em
  BEFORE UPDATE ON organizacoes_saas
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- RLS: Somente Super Admin pode acessar
ALTER TABLE organizacoes_saas ENABLE ROW LEVEL SECURITY;

-- Politica: Super Admin ve todas organizacoes
CREATE POLICY "super_admin_all_organizacoes" ON organizacoes_saas
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- Politica: Admin/Member ve apenas sua organizacao
CREATE POLICY "tenant_read_own_organizacao" ON organizacoes_saas
  FOR SELECT
  USING (
    id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
  );

COMMENT ON TABLE organizacoes_saas IS 'Tabela de tenants do SaaS - cada registro e uma empresa cliente';
