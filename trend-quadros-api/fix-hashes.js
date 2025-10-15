#!/usr/bin/env node

/**
 * Script para corrigir os hashes das senhas no banco
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configurações do banco
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'dashboard',
  user: 'postgres',
  password: 'postgres123',
});

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

async function fixHashes() {
  let client;
  
  try {
    console.log('🔧 Corrigindo hashes das senhas...');
    
    client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Limpar usuários existentes
    console.log('🗑️  Removendo usuários com hashes incorretos...');
    await client.query('DELETE FROM usuarios');
    console.log('✅ Usuários removidos');

    // Criar usuários com hashes corretos
    console.log('👥 Criando usuários com hashes corretos...');
    
    for (const user of users) {
      const senhaHash = bcrypt.hashSync(user.senha, 10);
      
      await client.query(
        'INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [user.nome, user.email, senhaHash, user.nivel, true]
      );
      
      console.log(`✅ ${user.nome} (${user.email}) - Hash: ${senhaHash.substring(0, 20)}...`);
    }

    // Verificar usuários criados
    console.log('\n📋 Verificando usuários no banco...');
    const result = await client.query('SELECT nome, email, LENGTH(senha_hash) as hash_length FROM usuarios ORDER BY created_at');
    
    console.log('\n👥 Usuários no banco:');
    console.log('Nome | Email | Tamanho do Hash');
    console.log('-----|-------|----------------');
    result.rows.forEach(user => {
      console.log(`${user.nome} | ${user.email} | ${user.hash_length} caracteres`);
    });

    console.log('\n🎯 CREDENCIAIS PARA TESTE:');
    console.log('==========================');
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`🔑 ${user.senha}`);
      console.log('');
    });

    console.log('✅ Hashes corrigidos com sucesso!');

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar
fixHashes();
