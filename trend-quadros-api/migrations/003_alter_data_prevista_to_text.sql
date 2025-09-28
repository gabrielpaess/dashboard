-- Migration: Alter data_prevista field from DATE to TEXT
-- Description: Changes data_prevista field to store DD/MM/YYYY format as string

-- Alter the data_prevista column from DATE to TEXT
ALTER TABLE public.pedidos 
ALTER COLUMN data_prevista TYPE TEXT;

-- Update comment for the column
COMMENT ON COLUMN public.pedidos.data_prevista IS 'Data prevista de entrega do pedido no formato DD/MM/YYYY conforme retornado pela API Tiny.';
