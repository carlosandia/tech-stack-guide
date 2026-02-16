
-- =============================================================
-- LIMPEZA DE DUPLICATAS @lid/@c.us - Org Personal Junior
-- Estratégia: Manter conversa @c.us, mover msgs da @lid para ela,
-- atualizar contato @c.us com nome do @lid, soft-delete @lid
-- =============================================================

-- STEP 1: Mover mensagens das conversas @lid para as conversas @c.us
UPDATE mensagens SET conversa_id = '4e0797a3-d070-43d4-8ce3-e186015abcda' WHERE conversa_id = '3c6aef88-5de2-4183-b0a4-b2fa218131c7'; -- Camila
UPDATE mensagens SET conversa_id = '8ef5b595-ac50-4a37-b4a9-acba1c8f00ec' WHERE conversa_id = '2ae762bf-24c3-43d5-b8a4-215b6a5f0359'; -- Adelania
UPDATE mensagens SET conversa_id = 'd7cf9db6-7ded-48e7-9a97-51df1bdacdc2' WHERE conversa_id = '9b84caae-e640-4c90-9c59-03f4c11d61a3'; -- Evelin
UPDATE mensagens SET conversa_id = '48ca87d2-65ed-476c-a9ef-1524f2d6be8a' WHERE conversa_id = '6fcd03c9-86b2-4d47-811b-7d961db92c38'; -- Paloma
UPDATE mensagens SET conversa_id = '66514dea-57f7-491e-a64c-2a3ee2752572' WHERE conversa_id = '782a76f5-ea47-4daa-9adc-f8efad145cc1'; -- Kel
UPDATE mensagens SET conversa_id = '39ceb243-a84e-4ec1-98c1-61f7a3fab521' WHERE conversa_id = 'ffe9a166-8e16-4fd8-8846-3b9ac00d6b0f'; -- Jhenny
UPDATE mensagens SET conversa_id = 'efac92a7-4b48-4641-8b66-71ffe930ee0f' WHERE conversa_id = 'e71a52a4-455a-408d-b15d-bd2fe9235b82'; -- Luan e Milli
UPDATE mensagens SET conversa_id = '4bb2ee0d-ffac-4e6e-a831-2d9dfe3d8cfd' WHERE conversa_id = 'b10cdd86-c7c0-4814-b80c-bcc80b71e394'; -- julianatorquato21
UPDATE mensagens SET conversa_id = 'f5f73e00-cf10-459a-a818-36ee40c7969b' WHERE conversa_id = '62735f72-2bb2-4669-8a5a-f1fef80c3ab8'; -- Debora
UPDATE mensagens SET conversa_id = '93ca1849-5a62-4f80-b50f-e3eaf2bba5ea' WHERE conversa_id = 'a69bfbce-f729-4844-b89b-d828d0313ae8'; -- Thays
UPDATE mensagens SET conversa_id = 'b6b3d1d2-7a2e-4404-9322-154d318e6ebb' WHERE conversa_id = '3533ce0d-028d-424e-8f6c-968521e9a77a'; -- Erica
UPDATE mensagens SET conversa_id = '954df05e-1487-468f-85c5-325f6e3e8c6a' WHERE conversa_id = '0b701329-f4c2-40fa-98bc-44c03426df35'; -- Marcella
UPDATE mensagens SET conversa_id = '2a8606e9-631e-4409-a51e-f1cafe583e70' WHERE conversa_id = '454bad03-5838-4f62-bb8b-074c7db1b98b'; -- Larissa
UPDATE mensagens SET conversa_id = 'ad354b33-d818-4e38-8e58-9d023321d27d' WHERE conversa_id = 'e2dd0b65-fe1c-4bce-b974-316161af1bdd'; -- Mariane
UPDATE mensagens SET conversa_id = 'c25ad035-0513-41dd-83c1-2d4d085c1777' WHERE conversa_id = '03b4220b-32de-43a5-ba0a-bebd2c8df4f6'; -- Luh

-- STEP 2: Atualizar contatos @c.us com nomes dos contatos @lid
UPDATE contatos SET nome = 'Camila' WHERE id = '2b4b739b-8b91-4e51-b6bf-864c93b723c3' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Adelania Souza' WHERE id = 'f607df82-5516-43f3-a2c5-6d28126d4d26' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Evelin' WHERE id = '73ab382b-2cc4-4bcc-b61c-1b62c30e2dc2' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Paloma' WHERE id = '78da0302-4acc-41c8-802f-c333be50cdce' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Kel' WHERE id = 'acb193d6-4c79-4331-8e1f-16aec28bbdb6' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Jhenny' WHERE id = 'af86507b-c504-4cc4-bf99-b1082e0c1839' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Luan e Milli 😍🐶' WHERE id = '25d3d5bc-5441-4a79-a630-3a99f7216f5d' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'julianatorquato21' WHERE id = '2f7f4397-d5c0-489b-ab02-378c4cf6a3a0' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Debora 🌷' WHERE id = '2ef19731-30ea-431c-8c71-187d6e357f9b' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Thays  Fonseca 🦋' WHERE id = '7a4da9c4-75a6-4a04-934a-985971fdae14' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Erica' WHERE id = 'a1f540c7-f813-4565-b411-391ef76c36ea' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Marcella Fernandes' WHERE id = '464784b5-c646-40ab-a754-a95aeb704a00' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Larissa Fontao' WHERE id = '590bb9ac-31b2-49e9-9b51-e11c503ff1c9' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Mariane' WHERE id = '386d761a-3d3b-46b4-93b9-3ffdc3aba64d' AND (nome IS NULL OR nome = telefone);
UPDATE contatos SET nome = 'Luh 🥰' WHERE id = 'e4922cfc-8185-4a2b-82d3-7ff6aa16cf66' AND (nome IS NULL OR nome = telefone);

-- STEP 3: Atualizar nome nas conversas @c.us mantidas
UPDATE conversas SET nome = 'Camila' WHERE id = '4e0797a3-d070-43d4-8ce3-e186015abcda';
UPDATE conversas SET nome = 'Adelania Souza' WHERE id = '8ef5b595-ac50-4a37-b4a9-acba1c8f00ec';
UPDATE conversas SET nome = 'Evelin' WHERE id = 'd7cf9db6-7ded-48e7-9a97-51df1bdacdc2';
UPDATE conversas SET nome = 'Paloma' WHERE id = '48ca87d2-65ed-476c-a9ef-1524f2d6be8a';
UPDATE conversas SET nome = 'Kel' WHERE id = '66514dea-57f7-491e-a64c-2a3ee2752572';
UPDATE conversas SET nome = 'Jhenny' WHERE id = '39ceb243-a84e-4ec1-98c1-61f7a3fab521';
UPDATE conversas SET nome = 'Luan e Milli 😍🐶' WHERE id = 'efac92a7-4b48-4641-8b66-71ffe930ee0f';
UPDATE conversas SET nome = 'julianatorquato21' WHERE id = '4bb2ee0d-ffac-4e6e-a831-2d9dfe3d8cfd';
UPDATE conversas SET nome = 'Debora 🌷' WHERE id = 'f5f73e00-cf10-459a-a818-36ee40c7969b';
UPDATE conversas SET nome = 'Thays  Fonseca 🦋' WHERE id = '93ca1849-5a62-4f80-b50f-e3eaf2bba5ea';
UPDATE conversas SET nome = 'Erica' WHERE id = 'b6b3d1d2-7a2e-4404-9322-154d318e6ebb';
UPDATE conversas SET nome = 'Marcella Fernandes' WHERE id = '954df05e-1487-468f-85c5-325f6e3e8c6a';
UPDATE conversas SET nome = 'Larissa Fontao' WHERE id = '2a8606e9-631e-4409-a51e-f1cafe583e70';
UPDATE conversas SET nome = 'Mariane' WHERE id = 'ad354b33-d818-4e38-8e58-9d023321d27d';
UPDATE conversas SET nome = 'Luh 🥰' WHERE id = 'c25ad035-0513-41dd-83c1-2d4d085c1777';

-- STEP 4: Soft-delete das conversas @lid (agora sem mensagens)
UPDATE conversas SET deletado_em = NOW() WHERE id IN (
  '3c6aef88-5de2-4183-b0a4-b2fa218131c7', '2ae762bf-24c3-43d5-b8a4-215b6a5f0359',
  '9b84caae-e640-4c90-9c59-03f4c11d61a3', '6fcd03c9-86b2-4d47-811b-7d961db92c38',
  '782a76f5-ea47-4daa-9adc-f8efad145cc1', 'ffe9a166-8e16-4fd8-8846-3b9ac00d6b0f',
  'e71a52a4-455a-408d-b15d-bd2fe9235b82', 'b10cdd86-c7c0-4814-b80c-bcc80b71e394',
  '62735f72-2bb2-4669-8a5a-f1fef80c3ab8', 'a69bfbce-f729-4844-b89b-d828d0313ae8',
  '3533ce0d-028d-424e-8f6c-968521e9a77a', '0b701329-f4c2-40fa-98bc-44c03426df35',
  '454bad03-5838-4f62-bb8b-074c7db1b98b', 'e2dd0b65-fe1c-4bce-b974-316161af1bdd',
  '03b4220b-32de-43a5-ba0a-bebd2c8df4f6'
);

-- STEP 5: Soft-delete dos contatos @lid órfãos
UPDATE contatos SET deletado_em = NOW() WHERE id IN (
  '221a4e13-1591-4d73-99dd-e207f23fe44b', '40d84ea5-a629-4331-b3e7-576d4d280bf0',
  '85c59c0f-9a18-43ad-b563-6e5f09e43b9e', '123eef02-2be0-441d-85ed-58fc8dcf1b4c',
  '25c3b91a-5334-4c0f-8258-e228e9a37887', '82d0fe64-1a12-4d43-93e8-8e0cbe220b31',
  '18da0442-b207-46db-be20-9bafd8fbc150', '1ae8a5f8-2b01-40a0-bbc9-66851fcba68a',
  '312a9427-dadc-4bd9-a4a5-d2d3959640ee', 'd36f1958-96ed-40f2-a3ed-cc9d2615015c',
  'd9b8b1ef-f06a-4210-a4f5-8be9c21c66f7', '242767dc-8d86-4cb0-a1d2-5730c0a00561',
  'acfba04a-7be1-409c-8a48-3afdd880da9d', 'cda11adb-9a21-4cdf-94f6-c23615cfb610',
  '7789fdf9-9455-4449-a075-1c2540716079'
);

-- STEP 6: Soft-delete contatos duplicados por nome (Danilo, juninho, Vicente com telefone @lid)
UPDATE contatos SET deletado_em = NOW() WHERE id IN (
  '5ffbc079-d3ee-4264-a498-7a17dd946afd',
  '3caf20aa-122c-462b-b7e6-05036ae9989d',
  '96b92273-1934-46d4-8709-cc64a1684b2a'
);

-- STEP 7: Atualizar contadores de mensagens nas conversas mantidas
UPDATE conversas c SET 
  total_mensagens = (SELECT COUNT(*) FROM mensagens m WHERE m.conversa_id = c.id),
  ultima_mensagem_em = (SELECT MAX(m.criado_em) FROM mensagens m WHERE m.conversa_id = c.id)
WHERE c.id IN (
  '4e0797a3-d070-43d4-8ce3-e186015abcda', '8ef5b595-ac50-4a37-b4a9-acba1c8f00ec',
  'd7cf9db6-7ded-48e7-9a97-51df1bdacdc2', '48ca87d2-65ed-476c-a9ef-1524f2d6be8a',
  '66514dea-57f7-491e-a64c-2a3ee2752572', '39ceb243-a84e-4ec1-98c1-61f7a3fab521',
  'efac92a7-4b48-4641-8b66-71ffe930ee0f', '4bb2ee0d-ffac-4e6e-a831-2d9dfe3d8cfd',
  'f5f73e00-cf10-459a-a818-36ee40c7969b', '93ca1849-5a62-4f80-b50f-e3eaf2bba5ea',
  'b6b3d1d2-7a2e-4404-9322-154d318e6ebb', '954df05e-1487-468f-85c5-325f6e3e8c6a',
  '2a8606e9-631e-4409-a51e-f1cafe583e70', 'ad354b33-d818-4e38-8e58-9d023321d27d',
  'c25ad035-0513-41dd-83c1-2d4d085c1777'
);
