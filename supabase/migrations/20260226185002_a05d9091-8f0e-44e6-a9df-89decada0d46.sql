-- AIDEV-NOTE: Remove constraint fixa de canais para permitir canais dinâmicos (Panfleto, Evento, etc.)
ALTER TABLE investimentos_marketing DROP CONSTRAINT chk_canal_valido;