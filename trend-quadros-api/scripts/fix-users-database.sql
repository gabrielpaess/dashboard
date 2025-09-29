-- Script para corrigir usuários no banco de dados
-- Execute este script diretamente no PostgreSQL

-- 1. Deletar todos os usuários existentes (limpeza)
DELETE FROM usuarios;

-- 2. Resetar a sequência do ID
ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;

-- 3. Criar usuários corretos com senhas hasheadas
-- Senhas geradas com bcrypt (cost 10)

-- Admin: williaamtelles@gmail.com / Pontoink2025!
INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES 
('Admin', 'williaamtelles@gmail.com', '$2b$10$hR95IRBri7qLwVZdcCT4hujNR0DgPH7zsWGsdkMIesMPu2RIup/0a', 'admin', true, NOW(), NOW());

-- Vendas: vendas@pontoquadros.com / Vendas2025!
INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES 
('Vendas', 'vendas@pontoquadros.com', '$2b$10$pE1FRRg.9CCBhsvhBjAXb.6MaRRodQXc6X8LUmRz8V4BYnsjwSf2.', 'vendas', true, NOW(), NOW());

-- Desenvolvimento: desenvolvimento@pontoquadros.com / Desenvolvimento2025!
INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES 
('Desenvolvimento', 'desenvolvimento@pontoquadros.com', '$2b$10$CDKw92u241DCT6j15ltNP.grD.I5zQstxhWZb8GsS3TfCGsyKr7fK', 'desenvolvimento', true, NOW(), NOW());

-- Produção: producao@pontoquadros.com / Producao2025!
INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES 
('Produção', 'producao@pontoquadros.com', '$2b$10$TI6tOH6xB3mda.CphgINW.fcCUgmv//zv37wyfsT//8Uei0B0S1te', 'producao', true, NOW(), NOW());

-- 4. Verificar usuários criados
SELECT 
    id,
    nome,
    email,
    nivel,
    ativo,
    created_at
FROM usuarios 
ORDER BY created_at;

-- 5. Mostrar resumo
SELECT 
    'Usuários criados com sucesso!' as status,
    COUNT(*) as total_usuarios
FROM usuarios;
