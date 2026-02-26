-- AIDEV-NOTE: Adiciona campo nivel_override para permitir Super Admin definir nível manualmente
-- Quando NULL, o nível é calculado automaticamente pela lógica de indicados
-- Quando preenchido com o nome do nível, sobrescreve o cálculo automático
ALTER TABLE parceiros ADD COLUMN IF NOT EXISTS nivel_override text DEFAULT NULL;