-- Adiciona colunas para horário de almoço na tabela salons
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS lunch_start text;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS lunch_end text;