-- Inserir etapas padrão (sistema) para organizações que não possuem
-- Personal Junior e Litoral Place

INSERT INTO etapas_templates (organizacao_id, nome, tipo, cor, probabilidade, sistema, ordem)
VALUES
  ('1a3e19c7-66d6-4016-b5bb-1351a75b0fe1', 'Novos Negocios', 'entrada', '#3B82F6', 10, true, 1),
  ('1a3e19c7-66d6-4016-b5bb-1351a75b0fe1', 'Ganho', 'ganho', '#22C55E', 100, true, 5),
  ('1a3e19c7-66d6-4016-b5bb-1351a75b0fe1', 'Perdido', 'perda', '#EF4444', 0, true, 6),
  ('0f93da3e-58b3-48f7-80e0-7e4902799357', 'Novos Negocios', 'entrada', '#3B82F6', 10, true, 1),
  ('0f93da3e-58b3-48f7-80e0-7e4902799357', 'Ganho', 'ganho', '#22C55E', 100, true, 5),
  ('0f93da3e-58b3-48f7-80e0-7e4902799357', 'Perdido', 'perda', '#EF4444', 0, true, 6);