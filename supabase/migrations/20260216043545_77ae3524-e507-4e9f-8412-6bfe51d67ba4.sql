
-- Atualizar conversas individuais com nomes numericos usando PushName de mensagens RECEBIDAS
UPDATE conversas c
SET nome = sub.push_name
FROM (
  SELECT DISTINCT ON (m.conversa_id) 
    m.conversa_id,
    COALESCE(
      m.raw_data->'_data'->'Info'->>'PushName',
      m.raw_data->'_data'->>'pushName'
    ) as push_name
  FROM mensagens m
  WHERE m.from_me = false
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) IS NOT NULL
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) != ''
  ORDER BY m.conversa_id, m.criado_em DESC
) sub
WHERE c.id = sub.conversa_id
AND c.tipo = 'individual'
AND c.nome ~ '^\d+$';

-- Atualizar contatos com nomes numericos
UPDATE contatos ct
SET nome = sub.push_name
FROM (
  SELECT DISTINCT ON (c.contato_id)
    c.contato_id,
    COALESCE(
      m.raw_data->'_data'->'Info'->>'PushName',
      m.raw_data->'_data'->>'pushName'
    ) as push_name
  FROM mensagens m
  JOIN conversas c ON c.id = m.conversa_id
  WHERE m.from_me = false
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) IS NOT NULL
  AND COALESCE(
    m.raw_data->'_data'->'Info'->>'PushName',
    m.raw_data->'_data'->>'pushName'
  ) != ''
  ORDER BY c.contato_id, m.criado_em DESC
) sub
WHERE ct.id = sub.contato_id
AND ct.nome ~ '^\d+$'
AND ct.deletado_em IS NULL;
