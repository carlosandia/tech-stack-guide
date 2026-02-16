
-- =====================================================
-- MERGE conversas @lid duplicadas para @c.us
-- =====================================================

-- LITORAL PLACE (org: 0f93da3e): 6 merges
-- Mover mensagens de @lid para @c.us
UPDATE mensagens SET conversa_id = '74e5b2e9-982c-4015-87fc-b7e176d83af5' WHERE conversa_id = '4a99022b-c620-4440-804a-e48e29eafe95';
UPDATE mensagens SET conversa_id = '24e21be9-7977-4e53-a795-9d4e19cf8176' WHERE conversa_id = 'eba1acc0-5356-40f3-ac8e-5e8f4d1fcbac';
UPDATE mensagens SET conversa_id = '2b29f6fd-1748-4e2f-9d50-edbb7bcf15ee' WHERE conversa_id = '09e2bbd1-7e46-4bb3-9b45-5c8e9d97d767';
UPDATE mensagens SET conversa_id = '7db1bf76-f058-412d-b237-e8981f1b8b0f' WHERE conversa_id = '94e6bf6c-f6c9-4df6-bb69-4145682bb8c5';
UPDATE mensagens SET conversa_id = '01965721-4471-4fcc-a2b5-5ace473177cc' WHERE conversa_id = '09f3353b-d261-4fde-8134-d896ffda6fda';
UPDATE mensagens SET conversa_id = 'a18be217-cbef-4f21-b280-7f0ff1a21cdb' WHERE conversa_id = '9864e319-021b-486f-bb96-71ddbebdf94c';

-- Soft-delete conversas @lid da Litoral Place
UPDATE conversas SET deletado_em = now() WHERE id IN (
  '4a99022b-c620-4440-804a-e48e29eafe95',
  'eba1acc0-5356-40f3-ac8e-5e8f4d1fcbac',
  '09e2bbd1-7e46-4bb3-9b45-5c8e9d97d767',
  '94e6bf6c-f6c9-4df6-bb69-4145682bb8c5',
  '09f3353b-d261-4fde-8134-d896ffda6fda',
  '9864e319-021b-486f-bb96-71ddbebdf94c'
);

-- Soft-delete contatos @lid duplicados da Litoral Place
UPDATE contatos SET deletado_em = now() WHERE id IN (
  '43cd6f91-b313-4bbd-a9a6-210a03bf5c78',
  '7b403d22-4eb2-4eff-8433-e5d5eb883393',
  'd14e1948-a9e3-4081-805b-e2d15ccbf671',
  '67bca70a-7151-4347-914e-68e733c4439b',
  '0e0b0a7a-2ff3-4f9c-ad32-84b7a5fcc472',
  '436c4960-16f5-4dcc-b121-0da5b3d41f7b'
);

-- Atualizar total_mensagens das conversas @c.us da Litoral Place
UPDATE conversas SET total_mensagens = (
  SELECT COUNT(*) FROM mensagens WHERE conversa_id = conversas.id AND deletado_em IS NULL
) WHERE id IN (
  '74e5b2e9-982c-4015-87fc-b7e176d83af5',
  '24e21be9-7977-4e53-a795-9d4e19cf8176',
  '2b29f6fd-1748-4e2f-9d50-edbb7bcf15ee',
  '7db1bf76-f058-412d-b237-e8981f1b8b0f',
  '01965721-4471-4fcc-a2b5-5ace473177cc',
  'a18be217-cbef-4f21-b280-7f0ff1a21cdb'
);

-- PERSONAL JUNIOR (org: 1a3e19c7): 4 merges
UPDATE mensagens SET conversa_id = '22284f3f-ab37-499a-86c0-5fd19d8c1678' WHERE conversa_id = '1559d402-72ce-45cb-a7e4-455d5b51422d';
UPDATE mensagens SET conversa_id = '24eb49c6-54cb-4333-ad8d-40819dc201c6' WHERE conversa_id = '8d3bdd25-fc38-4c1b-9779-a1d5ee6e60e5';
UPDATE mensagens SET conversa_id = 'f0c251d3-c193-427c-8617-499e321b8c29' WHERE conversa_id = '69b181da-3acf-42c7-9354-269676a12b3b';
UPDATE mensagens SET conversa_id = 'a1b61adc-0b55-4674-ae92-ea5aa9bb9b0f' WHERE conversa_id = '5c2f8148-839e-4c12-8814-91ea165b6653';

-- Soft-delete conversas @lid da Personal Junior (as 4 com match)
UPDATE conversas SET deletado_em = now() WHERE id IN (
  '1559d402-72ce-45cb-a7e4-455d5b51422d',
  '8d3bdd25-fc38-4c1b-9779-a1d5ee6e60e5',
  '69b181da-3acf-42c7-9354-269676a12b3b',
  '5c2f8148-839e-4c12-8814-91ea165b6653'
);

-- Soft-delete contatos @lid duplicados da Personal Junior
UPDATE contatos SET deletado_em = now() WHERE id IN (
  '6f313141-e17e-46b4-9045-66ea26544c74',
  '8ebb433f-8537-46be-8c4d-f3c132362175',
  'e8cb537c-c3b4-43c6-a915-4d1018a1e9ab',
  'a0483e88-4f5c-44f3-870b-a7c330671794'
);

-- Atualizar total_mensagens das conversas @c.us da Personal Junior
UPDATE conversas SET total_mensagens = (
  SELECT COUNT(*) FROM mensagens WHERE conversa_id = conversas.id AND deletado_em IS NULL
) WHERE id IN (
  '22284f3f-ab37-499a-86c0-5fd19d8c1678',
  '24eb49c6-54cb-4333-ad8d-40819dc201c6',
  'f0c251d3-c193-427c-8617-499e321b8c29',
  'a1b61adc-0b55-4674-ae92-ea5aa9bb9b0f'
);
