#!/usr/bin/env node

/**
 * Script para gerar hashes de senhas corretos
 */

const bcrypt = require('bcrypt');

const users = [
  { email: 'admin@pontoquadros.com', password: 'admin123', name: 'Administrador' },
  { email: 'vendas@pontoquadros.com', password: 'vendas123', name: 'Vendas' },
  { email: 'dev@pontoquadros.com', password: 'dev123', name: 'Desenvolvimento' },
  { email: 'producao@pontoquadros.com', password: 'prod123', name: 'Produção' },
  { email: 'pos@pontoquadros.com', password: 'pos123', name: 'Pós-venda' }
];

console.log('🔐 Gerando hashes de senhas...\n');

users.forEach(user => {
  const hash = bcrypt.hashSync(user.password, 10);
  console.log(`-- ${user.name} (${user.email})`);
  console.log(`-- Senha: ${user.password}`);
  console.log(`UPDATE usuarios SET senha_hash = '${hash}' WHERE email = '${user.email}';`);
  console.log('');
});

console.log('✅ Hashes gerados com sucesso!');
console.log('\n📋 Para aplicar no banco de dados:');
console.log('1. Execute os comandos UPDATE acima no banco');
console.log('2. Ou use: npm run migrate');
