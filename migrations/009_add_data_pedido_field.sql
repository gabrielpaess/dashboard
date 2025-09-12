-- Migration: Add data_pedido field to pedidos table
-- Description: Adds the order date field from Tiny API response

-- Add the data_pedido column as DATE to store YYYY-MM-DD format
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS data_pedido DATE;

-- Add comment for the new column
COMMENT ON COLUMN public.pedidos.data_pedido IS 'Data do pedido no formato YYYY-MM-DD para consultas e filtros';

-- Add index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pedido ON public.pedidos (data_pedido);

-- Update existing records to set data_pedido as NULL (will be populated on next sync)
UPDATE public.pedidos 
SET data_pedido = NULL 
WHERE data_pedido IS NULL;
