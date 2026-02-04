-- Corrige campos NULL que deveriam ser string vazia na tabela auth.users
-- O Supabase Auth espera que email_change seja string, não NULL

UPDATE auth.users 
SET 
  email_change = COALESCE(email_change, ''),
  phone_change = COALESCE(phone_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change_token = COALESCE(phone_change_token, '')
WHERE email = 'superadmin@renovedigital.com.br';