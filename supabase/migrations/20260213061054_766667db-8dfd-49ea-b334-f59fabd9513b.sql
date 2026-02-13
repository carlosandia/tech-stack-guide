-- Atualizar webhook_events para incluir poll.vote e usar message.any
UPDATE sessoes_whatsapp 
SET webhook_events = ARRAY['message.any', 'message.ack', 'poll.vote', 'poll.vote.failed'],
    atualizado_em = now()
WHERE webhook_events IS NOT NULL
  AND NOT (webhook_events @> ARRAY['poll.vote']);