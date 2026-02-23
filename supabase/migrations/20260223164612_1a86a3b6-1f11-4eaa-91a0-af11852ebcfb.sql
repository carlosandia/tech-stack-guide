-- Migration: Atualizar default do JSONB regras_gratuidade para incluir niveis
-- AIDEV-NOTE: Campo JSONB existente, apenas atualizamos o DEFAULT para incluir a estrutura de niveis

ALTER TABLE config_programa_parceiros
ALTER COLUMN regras_gratuidade SET DEFAULT '{
  "ativo": false,
  "niveis": [
    {"nome": "Bronze", "cor": "amber", "meta_indicados": 2, "percentual_comissao": 10, "bonus_valor": 0, "gratuidade": false},
    {"nome": "Prata", "cor": "gray", "meta_indicados": 5, "percentual_comissao": 12, "bonus_valor": 100, "gratuidade": false},
    {"nome": "Ouro", "cor": "yellow", "meta_indicados": 10, "percentual_comissao": 15, "bonus_valor": 300, "gratuidade": true},
    {"nome": "Diamante", "cor": "blue", "meta_indicados": 20, "percentual_comissao": 20, "bonus_valor": 500, "gratuidade": true}
  ],
  "carencia_dias": 30,
  "renovacao_periodo_meses": 12
}'::jsonb;

-- Atualizar registros existentes que nao tem a chave "niveis" no JSONB
UPDATE config_programa_parceiros
SET regras_gratuidade = regras_gratuidade || jsonb_build_object(
  'niveis', '[
    {"nome": "Bronze", "cor": "amber", "meta_indicados": 2, "percentual_comissao": 10, "bonus_valor": 0, "gratuidade": false},
    {"nome": "Prata", "cor": "gray", "meta_indicados": 5, "percentual_comissao": 12, "bonus_valor": 100, "gratuidade": false},
    {"nome": "Ouro", "cor": "yellow", "meta_indicados": 10, "percentual_comissao": 15, "bonus_valor": 300, "gratuidade": true},
    {"nome": "Diamante", "cor": "blue", "meta_indicados": 20, "percentual_comissao": 20, "bonus_valor": 500, "gratuidade": true}
  ]'::jsonb
)
WHERE NOT (regras_gratuidade ? 'niveis');