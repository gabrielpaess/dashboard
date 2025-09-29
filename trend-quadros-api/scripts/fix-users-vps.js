#!/usr/bin/env node

/**
 * Script para corrigir usuários na VPS
 * Execute: node scripts/fix-users-vps.js
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configurações do banco (VPS)
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'meus_pedidos',
  user: 'api_user',
  password: 'Pontoplacas25-',
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

async function fixUsers() {
  let client;
  
  try {
    console.log('🔧 Corrigindo usuários no banco de dados...');
    console.log('📊 Configurações:');
    console.log('   Host: localhost');
    console.log('   Database: meus_pedidos');
    console.log('   User: api_user');
    console.log('');

    client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // 1. Deletar todos os usuários existentes
    console.log('🗑️  Removendo usuários incorretos...');
    await client.query('DELETE FROM usuarios');
    console.log('✅ Usuários incorretos removidos');

    // 2. Resetar sequência do ID
    console.log('🔄 Resetando sequência do ID...');
    await client.query('ALTER SEQUENCE usuarios_id_seq RESTART WITH 1');
    console.log('✅ Sequência resetada');

    // 3. Criar usuários corretos
    console.log('👥 Criando usuários corretos...');
    
    for (const user of users) {
      const senhaHash = bcrypt.hashSync(user.senha, 10);
      
      await client.query(
        'INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
        [user.nome, user.email, senhaHash, user.nivel, true]
      );
      
      console.log(`✅ ${user.nome} (${user.email}) criado`);
    }

    // 4. Verificar usuários criados
    console.log('\n📋 Verificando usuários no banco...');
    const result = await client.query('SELECT id, nome, email, nivel, ativo FROM usuarios ORDER BY created_at');
    
    console.log('\n👥 Usuários no banco:');
    console.log('ID | Nome            | Email                           | Nível           | Ativo');
    console.log('---|-----------------|---------------------------------|-----------------|------');
    result.rows.forEach(user => {
      console.log(`${user.id.toString().padStart(2)} | ${user.nome.padEnd(15)} | ${user.email.padEnd(31)} | ${user.nivel.padEnd(15)} | ${user.ativo ? 'Sim' : 'Não'}`);
    });

    console.log('\n🎯 CREDENCIAIS PARA TESTE:');
    console.log('==========================');
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`🔑 ${user.senha}`);
      console.log('');
    });

    console.log('✅ Correção concluída com sucesso!');
    console.log('\n🔄 Próximos passos:');
    console.log('1. Reiniciar a API: pm2 restart trend-quadros-api');
    console.log('2. Testar login no Insomnia');
    console.log('3. Verificar se a API está funcionando');

  } catch (error) {
    console.error('💥 Erro:', error.message);
    console.log('\n🔧 Verifique se:');
    console.log('1. O PostgreSQL está rodando');
    console.log('2. O banco "meus_pedidos" existe');
    console.log('3. O usuário "api_user" tem permissões');
    console.log('4. As credenciais estão corretas');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar
fixUsers();
