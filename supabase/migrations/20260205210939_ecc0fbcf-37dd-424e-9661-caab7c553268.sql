
-- Remover dados da organização Renove Digital e seu admin
-- Org ID: 891a33f0-8a6f-4592-afb9-b0970dfc9c79
-- User auth_id: 893fb161-12d6-414e-804b-f33af6de5f3d
-- User ID (usuarios): 3d0b8b73-a037-4756-ad44-7e76e022db96

-- 1. Remover user_roles
DELETE FROM user_roles WHERE user_id = '893fb161-12d6-414e-804b-f33af6de5f3d';

-- 2. Remover assinaturas
DELETE FROM assinaturas WHERE organizacao_id = '891a33f0-8a6f-4592-afb9-b0970dfc9c79';

-- 3. Remover usuario da tabela usuarios
DELETE FROM usuarios WHERE id = '3d0b8b73-a037-4756-ad44-7e76e022db96';

-- 4. Remover organizacao
DELETE FROM organizacoes_saas WHERE id = '891a33f0-8a6f-4592-afb9-b0970dfc9c79';
