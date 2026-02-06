
-- =====================================================
-- Provisionar Templates de Etapas Padrão para Renove Digital
-- Conforme PRD-05 seção 3.1.5
-- =====================================================

INSERT INTO etapas_templates (organizacao_id, nome, descricao, tipo, cor, probabilidade, sistema, ordem, ativo)
VALUES
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Novos Negócios', 'Oportunidades recém-criadas entram aqui', 'entrada', '#3B82F6', 10, true, 0, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Qualificação', 'Avaliação do potencial da oportunidade', 'normal', '#EAB308', 20, false, 1, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Proposta', 'Envio de proposta comercial', 'normal', '#F97316', 50, false, 2, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Negociação', 'Negociação de termos e valores', 'normal', '#8B5CF6', 75, false, 3, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Ganho', 'Oportunidade fechada com sucesso', 'ganho', '#22C55E', 100, true, 4, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Perdido', 'Oportunidade perdida', 'perda', '#EF4444', 0, true, 5, true);

-- =====================================================
-- Provisionar Templates de Tarefas Padrão para Renove Digital
-- Conforme PRD-05 seção 3.1.4
-- =====================================================

INSERT INTO tarefas_templates (organizacao_id, titulo, descricao, tipo, canal, prioridade, dias_prazo, ativo)
VALUES
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Ligação de Qualificação', 'Realizar ligação para qualificar o lead e entender a necessidade', 'ligacao', 'telefone', 'alta', 1, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Enviar Proposta Comercial', 'Preparar e enviar proposta comercial personalizada', 'email', 'email', 'media', 2, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Reunião de Fechamento', 'Agendar e realizar reunião para fechar o negócio', 'reuniao', null, 'alta', 3, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Follow-up WhatsApp', 'Enviar mensagem de acompanhamento via WhatsApp', 'whatsapp', 'whatsapp', 'media', 1, true),
  ('6716bbd0-9533-4007-80e4-1533aa31789f', 'Visita Presencial', 'Realizar visita ao cliente para apresentação presencial', 'visita', null, 'media', 5, true);
