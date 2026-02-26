
CREATE TABLE preferencias_dashboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  organizacao_id uuid NOT NULL REFERENCES organizacoes_saas(id),
  config_exibicao jsonb NOT NULL DEFAULT '{"metas":true,"funil":true,"reunioes":true,"kpis-principais":true,"canal":true,"motivos":true}',
  ordem_blocos jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, organizacao_id)
);

CREATE INDEX idx_preferencias_dashboard_usuario_org ON preferencias_dashboard(organizacao_id, usuario_id);

ALTER TABLE preferencias_dashboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_proprias_preferencias" ON preferencias_dashboard
  FOR ALL USING (
    usuario_id IN (SELECT id FROM usuarios WHERE auth_id = auth.uid())
  );
