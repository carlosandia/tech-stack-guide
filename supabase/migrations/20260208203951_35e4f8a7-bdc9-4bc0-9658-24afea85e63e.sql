-- Conversa WhatsApp (Erike)
INSERT INTO conversas (
  id, organizacao_id, contato_id, usuario_id, chat_id, canal, tipo,
  nome, status, total_mensagens, mensagens_nao_lidas,
  ultima_mensagem_em, primeira_mensagem_em, criado_em, atualizado_em
) VALUES (
  'a1b2c3d4-1111-4aaa-bbbb-000000000001',
  '6716bbd0-9533-4007-80e4-1533aa31789f',
  '86a1dab8-715e-44ee-baa3-82d4648ce136',
  '9e09faf0-bf87-419c-9c34-769dbe675f0a',
  'whatsapp_erike_demo',
  'whatsapp',
  'individual',
  'Erike',
  'aberta',
  3, 1,
  now(), now() - interval '5 minutes',
  now() - interval '10 minutes', now()
);

-- Mensagens da conversa WhatsApp
INSERT INTO mensagens (organizacao_id, conversa_id, message_id, from_me, tipo, body, has_media, ack, criado_em) VALUES
('6716bbd0-9533-4007-80e4-1533aa31789f', 'a1b2c3d4-1111-4aaa-bbbb-000000000001', 'wamsg_1', false, 'text', 'Olá! Gostaria de saber mais sobre o plano empresarial', false, 3, now() - interval '10 minutes'),
('6716bbd0-9533-4007-80e4-1533aa31789f', 'a1b2c3d4-1111-4aaa-bbbb-000000000001', 'wamsg_2', true, 'text', 'Claro! O plano empresarial inclui até 10 usuários com acesso completo. Posso te enviar uma proposta?', false, 3, now() - interval '7 minutes'),
('6716bbd0-9533-4007-80e4-1533aa31789f', 'a1b2c3d4-1111-4aaa-bbbb-000000000001', 'wamsg_3', false, 'text', 'Sim, por favor! Pode enviar para meu email?', false, 3, now());

-- Conversa Instagram (Gabriel)
INSERT INTO conversas (
  id, organizacao_id, contato_id, usuario_id, chat_id, canal, tipo,
  nome, status, total_mensagens, mensagens_nao_lidas,
  ultima_mensagem_em, primeira_mensagem_em, criado_em, atualizado_em
) VALUES (
  'a1b2c3d4-2222-4aaa-bbbb-000000000002',
  '6716bbd0-9533-4007-80e4-1533aa31789f',
  '71cad7aa-d82f-45d4-8c4e-4a6865bcaee6',
  '9e09faf0-bf87-419c-9c34-769dbe675f0a',
  'ig_gabriel_demo',
  'instagram',
  'individual',
  'Gabriel',
  'aberta',
  2, 1,
  now() - interval '30 minutes', now() - interval '1 hour',
  now() - interval '1 hour', now() - interval '30 minutes'
);

-- Mensagens da conversa Instagram
INSERT INTO mensagens (organizacao_id, conversa_id, message_id, from_me, tipo, body, has_media, ack, criado_em) VALUES
('6716bbd0-9533-4007-80e4-1533aa31789f', 'a1b2c3d4-2222-4aaa-bbbb-000000000002', 'igmsg_1', false, 'text', 'Vi o post de vocês sobre o CRM novo, como funciona?', false, 3, now() - interval '1 hour'),
('6716bbd0-9533-4007-80e4-1533aa31789f', 'a1b2c3d4-2222-4aaa-bbbb-000000000002', 'igmsg_2', true, 'text', 'Funciona tudo integrado! WhatsApp, Instagram e pipeline de vendas. Quer agendar uma demo?', false, 3, now() - interval '30 minutes');