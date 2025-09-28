-- Refatoração da tabela pedidos (principal)
-- Adicionar campos necessários e coluna JSON para itens

-- Adicionar colunas necessárias na tabela pedidos
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS data_pedido_pt_br TEXT,
ADD COLUMN IF NOT EXISTS nome_vendedor TEXT,
ADD COLUMN IF NOT EXISTS itens_json JSONB,
ADD COLUMN IF NOT EXISTS situacao TEXT,
ADD COLUMN IF NOT EXISTS valor_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS data_prevista TEXT,
ADD COLUMN IF NOT EXISTS envio_15 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS envio_45 BOOLEAN DEFAULT FALSE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_data_pedido_pt_br ON pedidos(data_pedido_pt_br);
CREATE INDEX IF NOT EXISTS idx_pedidos_nome_vendedor ON pedidos(nome_vendedor);
CREATE INDEX IF NOT EXISTS idx_pedidos_situacao ON pedidos(situacao);
CREATE INDEX IF NOT EXISTS idx_pedidos_itens_json ON pedidos USING GIN(itens_json);
CREATE INDEX IF NOT EXISTS idx_pedidos_data_prevista ON pedidos(data_prevista);

-- Comentários para documentação
COMMENT ON COLUMN pedidos.data_pedido_pt_br IS 'Data do pedido no formato DD/MM/YYYY para exibição';
COMMENT ON COLUMN pedidos.nome_vendedor IS 'Nome do vendedor responsável pelo pedido';
COMMENT ON COLUMN pedidos.itens_json IS 'Itens do pedido em formato JSON para acesso rápido';
COMMENT ON COLUMN pedidos.situacao IS 'Situação atual do pedido';
COMMENT ON COLUMN pedidos.valor_total IS 'Valor total do pedido';
COMMENT ON COLUMN pedidos.data_prevista IS 'Data prevista para entrega';
COMMENT ON COLUMN pedidos.envio_15 IS 'Indica se o pedido tem envio em 15 dias';
COMMENT ON COLUMN pedidos.envio_45 IS 'Indica se o pedido tem envio em 45 dias';
