
CREATE TABLE preferencias_colunas_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('pessoa', 'empresa')),
  colunas jsonb NOT NULL,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(usuario_id, tipo)
);

ALTER TABLE preferencias_colunas_contatos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios acessam suas proprias preferencias"
  ON preferencias_colunas_contatos
  FOR ALL
  USING (usuario_id = public.get_current_usuario_id())
  WITH CHECK (usuario_id = public.get_current_usuario_id());

CREATE TRIGGER update_preferencias_colunas_contatos_updated_at
  BEFORE UPDATE ON preferencias_colunas_contatos
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_atualizado_em();
