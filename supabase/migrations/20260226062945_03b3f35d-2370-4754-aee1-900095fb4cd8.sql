INSERT INTO modulos (nome, slug, descricao, obrigatorio)
VALUES
  ('Email Marketing', 'email-marketing', 'Envio de campanhas de email marketing em massa', false),
  ('WhatsApp Marketing', 'whatsapp-marketing', 'Envio de campanhas de WhatsApp marketing em massa', false)
ON CONFLICT (slug) DO NOTHING;