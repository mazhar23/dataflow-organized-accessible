-- Add extra_data column to leads table to store any additional columns
-- from uploaded Excel/CSV files that don't map to named DB columns.
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS extra_data jsonb;
