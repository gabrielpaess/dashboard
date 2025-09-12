-- Migration: Add data_prevista field to pedidos table
-- Description: Adds the expected delivery date field from Tiny API response

-- Add the data_prevista column as TEXT to store DD/MM/YYYY format
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS data_prevista TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.pedidos.data_prevista IS 'Data prevista de entrega do pedido no formato DD/MM/YYYY conforme retornado pela API Tiny.';

-- Add index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_pedidos_data_prevista ON public.pedidos (data_prevista);

-- Update existing records to set data_prevista as NULL (will be populated on next sync)
UPDATE public.pedidos 
SET data_prevista = NULL 
WHERE data_prevista IS NULL;
