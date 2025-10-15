-- Criar tabela de metas de vendas
CREATE TABLE sales_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  daily_goal DECIMAL(15,2) NOT NULL DEFAULT 7000.00,
  weekly_goal DECIMAL(15,2) NOT NULL DEFAULT 45000.00,
  monthly_goal DECIMAL(15,2) NOT NULL DEFAULT 200000.00,
  created_by INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX idx_sales_goals_created_by ON sales_goals(created_by);
CREATE INDEX idx_sales_goals_created_at ON sales_goals(created_at);

-- Inserir meta padrão
INSERT INTO sales_goals (daily_goal, weekly_goal, monthly_goal, created_by) 
SELECT 7000.00, 45000.00, 200000.00, id 
FROM usuarios 
WHERE nivel = 'admin' 
LIMIT 1;

-- Comentários da tabela
COMMENT ON TABLE sales_goals IS 'Tabela de metas de vendas configuráveis';
COMMENT ON COLUMN sales_goals.daily_goal IS 'Meta de vendas diária em reais';
COMMENT ON COLUMN sales_goals.weekly_goal IS 'Meta de vendas semanal em reais';
COMMENT ON COLUMN sales_goals.monthly_goal IS 'Meta de vendas mensal em reais';
COMMENT ON COLUMN sales_goals.created_by IS 'ID do usuário que criou/atualizou a meta';
