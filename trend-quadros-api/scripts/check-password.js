#!/usr/bin/env node

/**
 * Script para verificar qual senha corresponde ao hash
 */

const bcrypt = require('bcrypt');

const hash = '$2b$10$rQZ8K9vX8vX8vX8vX8vX8u';

// Lista de senhas possíveis baseadas nos comentários
const possiblePasswords = [
  'admin123',
  'vendas123', 
  'dev123',
  'prod123',
  'pos123',
  'password',
  '123456',
  'admin',
  'test',
  'senha123'
];

console.log('🔍 Verificando qual senha corresponde ao hash...');
console.log(`Hash: ${hash}\n`);

let found = false;

possiblePasswords.forEach(password => {
  const isValid = bcrypt.compareSync(password, hash);
  if (isValid) {
    console.log(`✅ SENHA ENCONTRADA: "${password}"`);
    found = true;
  } else {
    console.log(`❌ "${password}" - não confere`);
  }
});

if (!found) {
  console.log('\n❌ Nenhuma senha comum confere com o hash');
  console.log('🔧 O hash pode ter sido gerado com uma senha diferente');
  console.log('💡 Recomendação: Recriar os usuários com senhas conhecidas');
}
