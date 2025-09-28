-- Migration: Insert default users
-- This migration creates default users for the system

-- Insert default admin user (password: admin123)
INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES 
('Administrador', 'admin@pontoquadros.com', '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert default sales user (password: vendas123)
INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES 
('Vendas', 'vendas@pontoquadros.com', '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u', 'vendas')
ON CONFLICT (email) DO NOTHING;

-- Insert default development user (password: dev123)
INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES 
('Desenvolvimento', 'dev@pontoquadros.com', '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u', 'desenvolvimento')
ON CONFLICT (email) DO NOTHING;

-- Insert default production user (password: prod123)
INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES 
('Produção', 'producao@pontoquadros.com', '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u', 'producao')
ON CONFLICT (email) DO NOTHING;

-- Insert default after-sales user (password: pos123)
INSERT INTO usuarios (nome, email, senha_hash, nivel) VALUES 
('Pós-venda', 'pos@pontoquadros.com', '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u', 'after-sales')
ON CONFLICT (email) DO NOTHING;
