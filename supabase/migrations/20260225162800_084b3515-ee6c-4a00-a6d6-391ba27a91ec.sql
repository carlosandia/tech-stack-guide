-- Correcao retroativa: preencher body de mensagens templateMessage (Mercado Pago, PicPay, etc)
-- que foram salvas com body NULL porque o webhook nao extraia o texto de templateMessage
UPDATE mensagens 
SET body = raw_data->'_data'->'Message'->'templateMessage'->'Format'->'InteractiveMessageTemplate'->'body'->>'text',
    atualizado_em = now()
WHERE body IS NULL 
  AND tipo = 'text' 
  AND deletado_em IS NULL
  AND raw_data->'_data'->'Message'->'templateMessage'->'Format'->'InteractiveMessageTemplate'->'body'->>'text' IS NOT NULL;