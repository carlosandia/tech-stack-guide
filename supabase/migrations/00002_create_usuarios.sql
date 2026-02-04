-- Migration: 00002_create_usuarios
-- Descricao: Tabela de usuarios do sistema
-- AIDEV-NOTE: Vinculada ao auth.users do Supabase

-- Enum de roles
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member');

-- Enum de status do usuario
CREATE TYPE usuario_status AS ENUM ('ativo', 'inativo', 'pendente', 'bloqueado');

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Referencia ao auth.users do Supabase
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Vinculo com organizacao (null para super_admin)
  organizacao_id UUID REFERENCES organizacoes_saas(id) ON DELETE CASCADE,

  -- Dados basicos
  nome VARCHAR(255) NOT NULL,
  sobrenome VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  avatar_url TEXT,

  -- Permissoes
  role user_role NOT NULL DEFAULT 'member',
  status usuario_status NOT NULL DEFAULT 'pendente',

  -- Configuracoes
  notificacoes_email BOOLEAN NOT NULL DEFAULT true,
  notificacoes_push BOOLEAN NOT NULL DEFAULT true,

  -- Tracking
  ultimo_login TIMESTAMPTZ,

  -- Timestamps
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  deletado_em TIMESTAMPTZ -- soft delete
);

-- Indices compostos para multi-tenant
CREATE INDEX idx_usuarios_organizacao_email
  ON usuarios(organizacao_id, email) WHERE deletado_em IS NULL;

CREATE INDEX idx_usuarios_organizacao_role
  ON usuarios(organizacao_id, role) WHERE deletado_em IS NULL;

CREATE INDEX idx_usuarios_auth_id
  ON usuarios(auth_id) WHERE deletado_em IS NULL;

-- Trigger para atualizar atualizado_em
CREATE TRIGGER tr_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Politica: Super Admin ve todos
CREATE POLICY "super_admin_all_usuarios" ON usuarios
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'super_admin'
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

-- Politica: Admin ve usuarios da sua organizacao
CREATE POLICY "admin_tenant_usuarios" ON usuarios
  FOR ALL
  USING (
    organizacao_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid
    AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Politica: Member ve apenas a si mesmo
CREATE POLICY "member_own_usuario" ON usuarios
  FOR SELECT
  USING (
    auth_id = auth.uid()
  );

COMMENT ON TABLE usuarios IS 'Usuarios do sistema vinculados ao auth.users do Supabase';
