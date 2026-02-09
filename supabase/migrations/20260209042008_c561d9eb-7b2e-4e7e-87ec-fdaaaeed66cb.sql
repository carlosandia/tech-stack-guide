-- Limpar URLs de mídia quebradas (apontando para WAHA que já expirou)
UPDATE mensagens 
SET media_url = NULL, atualizado_em = now() 
WHERE media_url LIKE '%waha.renovedigital.com.br%';
