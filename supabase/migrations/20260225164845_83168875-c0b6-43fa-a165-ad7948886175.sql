UPDATE mensagens
SET body = regexp_replace(body, E'\uFFFD', '', 'g'),
    atualizado_em = now()
WHERE body LIKE '%' || E'\uFFFD' || '%'
  AND deletado_em IS NULL;