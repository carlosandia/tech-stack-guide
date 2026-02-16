
-- =====================================================
-- AIDEV-NOTE: Correcao de sufixo de device GOWS
-- Remove ":XX" de telefones e chat_ids, mescla duplicados
-- =====================================================

-- 1. MESCLAR CONVERSA DUPLICADA DO DANILO
-- Mover mensagens da conversa duplicada (9ea88237) para a original (cecab335)
UPDATE mensagens
SET conversa_id = 'cecab335-2ff2-4bb1-bca6-2cbd7b1e7ba2'
WHERE conversa_id = '9ea88237-e204-4607-ab06-7d5079cfaa87'
  AND deletado_em IS NULL;

-- Soft delete da conversa duplicada
UPDATE conversas
SET deletado_em = now()
WHERE id = '9ea88237-e204-4607-ab06-7d5079cfaa87';

-- Atualizar contadores da conversa original
UPDATE conversas
SET total_mensagens = (
  SELECT COUNT(*) FROM mensagens 
  WHERE conversa_id = 'cecab335-2ff2-4bb1-bca6-2cbd7b1e7ba2' AND deletado_em IS NULL
),
ultima_mensagem_em = (
  SELECT MAX(criado_em) FROM mensagens 
  WHERE conversa_id = 'cecab335-2ff2-4bb1-bca6-2cbd7b1e7ba2' AND deletado_em IS NULL
)
WHERE id = 'cecab335-2ff2-4bb1-bca6-2cbd7b1e7ba2';

-- Atualizar nome da conversa original com o PushName (Danilo Luiz)
UPDATE conversas
SET nome = 'Danilo Luiz'
WHERE id = 'cecab335-2ff2-4bb1-bca6-2cbd7b1e7ba2' AND (nome IS NULL OR nome = '5513974079532');

-- Atualizar nome do contato original do Danilo (que tinha só o telefone como nome)
UPDATE contatos
SET nome = 'Danilo Luiz'
WHERE id = '395114f7-c61e-4a79-9c28-eb97125dcf05' AND (nome IS NULL OR nome = '5513974079532');

-- 2. SOFT DELETE CONTATOS DUPLICADOS QUE TEM PAR ORIGINAL
-- Redirecionar conversas do contato duplicado para o original antes de deletar
UPDATE conversas SET contato_id = '4ee60059-0c36-4c5f-ac15-03348d25e44f' WHERE contato_id = '066d124e-5356-4a33-8b15-dc3406be8291' AND deletado_em IS NULL;
UPDATE conversas SET contato_id = 'f48de681-73b0-477e-ab21-9ac5724d51aa' WHERE contato_id = '07ee6c4f-0c98-4530-8128-1d8a4f1c34bf' AND deletado_em IS NULL;
UPDATE conversas SET contato_id = '0771d984-b712-4872-a133-b521fbc359d2' WHERE contato_id = '0e1812a7-b623-429f-915e-37e752171d46' AND deletado_em IS NULL;
UPDATE conversas SET contato_id = 'b9a931c3-6295-48eb-aa8f-0bed1959be49' WHERE contato_id = '6f093a14-98f3-4c60-b304-808f46253799' AND deletado_em IS NULL;
UPDATE conversas SET contato_id = '395114f7-c61e-4a79-9c28-eb97125dcf05' WHERE contato_id = '387a4ae4-3adb-4b82-84c0-e7978b9d7fd7' AND deletado_em IS NULL;

-- Redirecionar oportunidades
UPDATE oportunidades SET contato_id = '4ee60059-0c36-4c5f-ac15-03348d25e44f' WHERE contato_id = '066d124e-5356-4a33-8b15-dc3406be8291' AND deletado_em IS NULL;
UPDATE oportunidades SET contato_id = 'f48de681-73b0-477e-ab21-9ac5724d51aa' WHERE contato_id = '07ee6c4f-0c98-4530-8128-1d8a4f1c34bf' AND deletado_em IS NULL;
UPDATE oportunidades SET contato_id = '0771d984-b712-4872-a133-b521fbc359d2' WHERE contato_id = '0e1812a7-b623-429f-915e-37e752171d46' AND deletado_em IS NULL;
UPDATE oportunidades SET contato_id = 'b9a931c3-6295-48eb-aa8f-0bed1959be49' WHERE contato_id = '6f093a14-98f3-4c60-b304-808f46253799' AND deletado_em IS NULL;
UPDATE oportunidades SET contato_id = '395114f7-c61e-4a79-9c28-eb97125dcf05' WHERE contato_id = '387a4ae4-3adb-4b82-84c0-e7978b9d7fd7' AND deletado_em IS NULL;

-- Redirecionar tarefas
UPDATE tarefas SET contato_id = '4ee60059-0c36-4c5f-ac15-03348d25e44f' WHERE contato_id = '066d124e-5356-4a33-8b15-dc3406be8291' AND deletado_em IS NULL;
UPDATE tarefas SET contato_id = 'f48de681-73b0-477e-ab21-9ac5724d51aa' WHERE contato_id = '07ee6c4f-0c98-4530-8128-1d8a4f1c34bf' AND deletado_em IS NULL;
UPDATE tarefas SET contato_id = '0771d984-b712-4872-a133-b521fbc359d2' WHERE contato_id = '0e1812a7-b623-429f-915e-37e752171d46' AND deletado_em IS NULL;
UPDATE tarefas SET contato_id = 'b9a931c3-6295-48eb-aa8f-0bed1959be49' WHERE contato_id = '6f093a14-98f3-4c60-b304-808f46253799' AND deletado_em IS NULL;
UPDATE tarefas SET contato_id = '395114f7-c61e-4a79-9c28-eb97125dcf05' WHERE contato_id = '387a4ae4-3adb-4b82-84c0-e7978b9d7fd7' AND deletado_em IS NULL;

-- Soft delete dos 5 contatos duplicados que tinham par original
UPDATE contatos SET deletado_em = now() WHERE id IN (
  '066d124e-5356-4a33-8b15-dc3406be8291',
  '07ee6c4f-0c98-4530-8128-1d8a4f1c34bf',
  '0e1812a7-b623-429f-915e-37e752171d46',
  '6f093a14-98f3-4c60-b304-808f46253799',
  '387a4ae4-3adb-4b82-84c0-e7978b9d7fd7'
);

-- 3. CORRIGIR TELEFONES DOS CONTATOS RESTANTES (sem par, apenas limpar sufixo)
UPDATE contatos
SET telefone = REGEXP_REPLACE(telefone, ':\d+$', '')
WHERE telefone ~ ':\d+$' AND deletado_em IS NULL;

-- 4. CORRIGIR CHAT_IDs DAS CONVERSAS (limpar sufixo de device)
UPDATE conversas
SET chat_id = REGEXP_REPLACE(chat_id, ':\d+@', '@')
WHERE chat_id ~ ':\d+@' AND deletado_em IS NULL;
