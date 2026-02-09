-- Corrigir mensagens históricas com tipo errado (salvas como "text" mas com mídia)
UPDATE mensagens SET tipo = 'image', atualizado_em = now() WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'image/%';
UPDATE mensagens SET tipo = 'video', atualizado_em = now() WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'video/%';
UPDATE mensagens SET tipo = 'audio', atualizado_em = now() WHERE tipo = 'text' AND has_media = true AND media_mimetype LIKE 'audio/%';
UPDATE mensagens SET tipo = 'document', atualizado_em = now() WHERE tipo = 'text' AND has_media = true AND media_mimetype IS NOT NULL AND media_mimetype NOT LIKE 'image/%' AND media_mimetype NOT LIKE 'video/%' AND media_mimetype NOT LIKE 'audio/%';