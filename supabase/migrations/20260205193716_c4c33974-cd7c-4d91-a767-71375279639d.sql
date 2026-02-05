
-- Remover role do admin carlos
DELETE FROM public.user_roles WHERE user_id = '96f33897-af52-4cbc-8643-a7e31a622624';

-- Remover usuario admin da tabela usuarios
DELETE FROM public.usuarios WHERE id = 'cf998eb0-f29c-45a4-8dbd-060e2b4a4492';

-- Remover assinatura da org
DELETE FROM public.assinaturas WHERE organizacao_id = '2b7fb19d-b5ca-4618-9a9c-07603c1fd61c';

-- Remover organizacao
DELETE FROM public.organizacoes_saas WHERE id = '2b7fb19d-b5ca-4618-9a9c-07603c1fd61c';

-- Remover todos os planos
DELETE FROM public.planos;

-- Remover usuario do auth (carlos)
DELETE FROM auth.users WHERE id = '96f33897-af52-4cbc-8643-a7e31a622624';
