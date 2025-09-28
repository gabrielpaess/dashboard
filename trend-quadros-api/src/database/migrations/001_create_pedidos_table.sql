-- Migration: Create pedidos table
-- This table stores order data from Tiny API

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    pedido_id VARCHAR(255) UNIQUE NOT NULL,
    numero VARCHAR(255),
    nome_cliente VARCHAR(255),
    data_pedido DATE,
    data_pedido_pt_br VARCHAR(255),
    data_prevista VARCHAR(255),
    situacao VARCHAR(255),
    valor_total DECIMAL(10,2),
    nome_vendedor VARCHAR(255),
    itens_json JSONB,
    envio_15 BOOLEAN DEFAULT FALSE,
    envio_45 BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_pedido_id ON pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_situacao ON pedidos(situacao);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pedido ON pedidos(data_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_updated_at ON pedidos(updated_at);

-- Add comments
COMMENT ON TABLE pedidos IS 'Tabela de pedidos sincronizados da API Tiny';
COMMENT ON COLUMN pedidos.pedido_id IS 'ID único do pedido na API Tiny';
COMMENT ON COLUMN pedidos.numero IS 'Número do pedido para exibição';
COMMENT ON COLUMN pedidos.nome_cliente IS 'Nome do cliente';
COMMENT ON COLUMN pedidos.data_pedido IS 'Data do pedido (formato ISO)';
COMMENT ON COLUMN pedidos.data_pedido_pt_br IS 'Data do pedido (formato DD/MM/YYYY)';
COMMENT ON COLUMN pedidos.data_prevista IS 'Data prevista de entrega (formato DD/MM/YYYY)';
COMMENT ON COLUMN pedidos.situacao IS 'Situação atual do pedido';
COMMENT ON COLUMN pedidos.valor_total IS 'Valor total do pedido';
COMMENT ON COLUMN pedidos.nome_vendedor IS 'Nome do vendedor responsável';
COMMENT ON COLUMN pedidos.itens_json IS 'Itens do pedido em formato JSON';
COMMENT ON COLUMN pedidos.envio_15 IS 'Indica se precisa de follow-up de 15 dias';
COMMENT ON COLUMN pedidos.envio_45 IS 'Indica se precisa de follow-up de 45 dias';
