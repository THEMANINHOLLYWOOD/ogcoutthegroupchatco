-- Add paid_travelers column to trips table for persisting payment status
ALTER TABLE public.trips ADD COLUMN paid_travelers jsonb DEFAULT '[]'::jsonb;