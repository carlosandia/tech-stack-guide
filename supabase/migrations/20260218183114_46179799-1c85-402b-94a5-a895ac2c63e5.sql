
ALTER TABLE public.pre_cadastros_saas
  ADD COLUMN aceite_termos boolean NOT NULL DEFAULT false,
  ADD COLUMN aceite_termos_em timestamptz;
