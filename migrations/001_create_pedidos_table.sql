-- Migration: Create pedidos table
-- Description: Table to store orders from Tiny API with tracking for 15 and 45 day notifications

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(50) UNIQUE NOT NULL, -- ID from Tiny API
    nome_cliente VARCHAR(255) NOT NULL,    -- Customer name
    envio_15 BOOLEAN DEFAULT FALSE,        -- 15-day notification sent
    envio_45 BOOLEAN DEFAULT FALSE,        -- 45-day notification sent
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups by pedido_id
CREATE INDEX IF NOT EXISTS idx_pedidos_pedido_id ON pedidos(pedido_id);

-- Create index for notification tracking
CREATE INDEX IF NOT EXISTS idx_pedidos_notifications ON pedidos(envio_15, envio_45);

-- Add comment to table
COMMENT ON TABLE pedidos IS 'Table to store orders from Tiny API with notification tracking';
COMMENT ON COLUMN pedidos.pedido_id IS 'Order ID from Tiny API (unique)';
COMMENT ON COLUMN pedidos.nome_cliente IS 'Customer name from the order';
COMMENT ON COLUMN pedidos.envio_15 IS 'Whether 15-day notification was sent';
COMMENT ON COLUMN pedidos.envio_45 IS 'Whether 45-day notification was sent';
