-- AIDEV-NOTE: Backfill conservador - marcar oportunidades do widget como whatsapp_widget
-- Identifica oportunidades sem origem que possuem contato com origem 'whatsapp'
-- e que NÃO possuem pre_oportunidade associada (indicando que vieram do widget)
UPDATE oportunidades o
SET origem = 'whatsapp_widget',
    atualizado_em = now()
WHERE o.origem IS NULL
  AND o.deletado_em IS NULL
  AND EXISTS (
    SELECT 1 FROM contatos c
    WHERE c.id = o.contato_id
    AND c.origem = 'whatsapp'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pre_oportunidades po
    WHERE po.oportunidade_id = o.id
  );