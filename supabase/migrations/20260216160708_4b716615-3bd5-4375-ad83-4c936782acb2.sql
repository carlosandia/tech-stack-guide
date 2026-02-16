
-- =====================================================
-- 1. Resetar nomes corrompidos "Keven Litoral Place"
-- =====================================================
UPDATE contatos SET nome = telefone, atualizado_em = now()
WHERE nome = 'Keven Litoral Place' AND deletado_em IS NULL
AND telefone != '5513974109032';

-- =====================================================
-- 2. Resetar nomes corrompidos "Comercial Junior Santos"  
-- =====================================================
UPDATE contatos SET nome = telefone, atualizado_em = now()
WHERE nome = 'Comercial Junior Santos' AND deletado_em IS NULL;

-- =====================================================
-- 3. Atualizar nome nas conversas vinculadas a contatos resetados
-- =====================================================
UPDATE conversas SET nome = ct.telefone
FROM contatos ct 
WHERE conversas.contato_id = ct.id
AND ct.nome = ct.telefone 
AND conversas.deletado_em IS NULL
AND conversas.tipo = 'individual';

-- =====================================================
-- 4. Soft-delete conversas duplicadas de sessões antigas
-- Para cada chat_id duplicado, manter apenas a conversa mais recente
-- =====================================================
UPDATE conversas SET deletado_em = now()
WHERE id IN (
  SELECT c1.id
  FROM conversas c1
  JOIN conversas c2 ON c1.chat_id = c2.chat_id 
    AND c1.organizacao_id = c2.organizacao_id
    AND c1.id != c2.id
  WHERE c1.deletado_em IS NULL 
    AND c2.deletado_em IS NULL
    AND c1.criado_em < c2.criado_em
);
