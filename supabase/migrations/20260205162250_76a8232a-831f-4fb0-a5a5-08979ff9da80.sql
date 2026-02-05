-- Atualizar configuracao do Stripe com nomes de campos corretos
UPDATE configuracoes_globais 
SET 
  configuracoes = jsonb_build_object(
    'public_key', (configuracoes->>'publishable_key')::text,
    'secret_key_encrypted', (configuracoes->>'secret_key')::text,
    'webhook_secret_encrypted', (configuracoes->>'webhook_secret')::text,
    'trial_habilitado', (configuracoes->>'trial_habilitado')::text,
    'trial_dias', (configuracoes->>'trial_dias')::text
  ),
  configurado = true
WHERE plataforma = 'stripe' 
  AND configuracoes->>'publishable_key' IS NOT NULL 
  AND configuracoes->>'secret_key' IS NOT NULL;