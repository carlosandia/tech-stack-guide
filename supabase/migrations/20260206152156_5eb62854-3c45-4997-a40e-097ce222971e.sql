
-- Criar campos do sistema para tenant Renove Digital
-- organizacao_id: 6716bbd0-9533-4007-80e4-1533aa31789f
-- criado_por: 9e09faf0-bf87-419c-9c34-769dbe675f0a

-- Campos de Pessoa (6)
INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
VALUES
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Nome', 'nome', 'pessoa', 'texto', true, true, 1, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Sobrenome', 'sobrenome', 'pessoa', 'texto', false, true, 2, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Email', 'email', 'pessoa', 'email', false, true, 3, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Telefone', 'telefone', 'pessoa', 'telefone', false, true, 4, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Cargo', 'cargo', 'pessoa', 'texto', false, true, 5, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'LinkedIn', 'linkedin', 'pessoa', 'url', false, true, 6, '9e09faf0-bf87-419c-9c34-769dbe675f0a');

-- Campos de Empresa (8)
INSERT INTO campos_customizados (organizacao_id, nome, slug, entidade, tipo, obrigatorio, sistema, ordem, criado_por)
VALUES
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Nome Fantasia', 'nome_fantasia', 'empresa', 'texto', true, true, 1, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Razão Social', 'razao_social', 'empresa', 'texto', false, true, 2, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'CNPJ', 'cnpj', 'empresa', 'cnpj', false, true, 3, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Email', 'email', 'empresa', 'email', false, true, 4, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Telefone', 'telefone', 'empresa', 'telefone', false, true, 5, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Website', 'website', 'empresa', 'url', false, true, 6, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Segmento de Mercado', 'segmento', 'empresa', 'texto', false, true, 7, '9e09faf0-bf87-419c-9c34-769dbe675f0a'),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Porte', 'porte', 'empresa', 'select', false, true, 8, '9e09faf0-bf87-419c-9c34-769dbe675f0a');
