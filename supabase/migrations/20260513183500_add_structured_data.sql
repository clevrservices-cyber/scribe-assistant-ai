-- Add structured_data column to support Layer 2 Clinical Extraction
ALTER TABLE public.scribes ADD COLUMN structured_data JSONB;
