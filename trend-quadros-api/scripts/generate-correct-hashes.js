#!/usr/bin/env node

/**
 * Script para gerar hashes corretos das senhas especificadas
 */

const bcrypt = require('bcrypt');

const users = [
  {
    nome: 'Admin',
    email: 'williaamtelles@gmail.com',
    senha: 'Pontoink2025!',
    nivel: 'admin'
  },
  {
    nome: 'Vendas',
    email: 'vendas@pontoquadros.com',
    senha: 'Vendas2025!',
    nivel: 'vendas'
  },
  {
    nome: 'Desenvolvimento',
    email: 'desenvolvimento@pontoquadros.com',
    senha: 'Desenvolvimento2025!',
    nivel: 'desenvolvimento'
  },
  {
    nome: 'Produção',
    email: 'producao@pontoquadros.com',
    senha: 'Producao2025!',
    nivel: 'producao'
  }
];

console.log('🔐 Gerando hashes corretos para as senhas especificadas...\n');

console.log('-- Script SQL para executar no banco:');
console.log('-- ======================================');
console.log('');

console.log('-- 1. Deletar todos os usuários existentes');
console.log('DELETE FROM usuarios;');
console.log('');

console.log('-- 2. Resetar sequência do ID');
console.log('ALTER SEQUENCE usuarios_id_seq RESTART WITH 1;');
console.log('');

console.log('-- 3. Inserir usuários corretos:');
console.log('');

users.forEach((user, index) => {
  const hash = bcrypt.hashSync(user.senha, 10);
  
  console.log(`-- ${user.nome}: ${user.email} / ${user.senha}`);
  console.log(`INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES`);
  console.log(`('${user.nome}', '${user.email}', '${hash}', '${user.nivel}', true, NOW(), NOW());`);
  console.log('');
});

console.log('-- 4. Verificar usuários criados');
console.log('SELECT id, nome, email, nivel, ativo, created_at FROM usuarios ORDER BY created_at;');
console.log('');

console.log('✅ Hashes gerados com sucesso!');
console.log('\n📋 Para aplicar no banco:');
console.log('1. Copie o SQL acima');
console.log('2. Execute no PostgreSQL');
console.log('3. Ou use: psql -d meus_pedidos -U api_user -f fix-users-database.sql');
