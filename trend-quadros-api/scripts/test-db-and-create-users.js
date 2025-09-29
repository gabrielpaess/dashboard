#!/usr/bin/env node

/**
 * Script para testar conexão e criar usuários
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const path = require('path');

// Carregar .env explicitamente
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

console.log('🔍 Configurações do banco:');
console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
console.log('DB_PORT:', process.env.DB_PORT || '5432');
console.log('DB_NAME:', process.env.DB_NAME || 'meus_pedidos');
console.log('DB_USER:', process.env.DB_USER || 'api_user');
console.log('');

// Configuração do banco
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'meus_pedidos',
  user: process.env.DB_USER || 'api_user',
  password: process.env.DB_PASSWORD || 'Pontoplacas25-',
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

async function testConnectionAndCreateUsers() {
  let client;
  
  try {
    console.log('🔌 Testando conexão com o banco...');
    client = await pool.connect();
    console.log('✅ Conectado ao banco de dados com sucesso!');

    // Testar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'usuarios'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela "usuarios" não existe!');
      console.log('💡 Execute as migrations primeiro: npm run migrate');
      return;
    }
    
    console.log('✅ Tabela "usuarios" existe');

    console.log('\n🔐 Criando/atualizando usuários...\n');

    for (const user of users) {
      try {
        // Gerar hash da senha
        const senhaHash = bcrypt.hashSync(user.senha, 10);
        
        // Verificar se usuário já existe
        const existingUser = await client.query(
          'SELECT id FROM usuarios WHERE email = $1',
          [user.email]
        );

        if (existingUser.rows.length > 0) {
          // Atualizar usuário existente
          await client.query(
            'UPDATE usuarios SET nome = $1, senha_hash = $2, nivel = $3, updated_at = NOW() WHERE email = $4',
            [user.nome, senhaHash, user.nivel, user.email]
          );
          console.log(`🔄 Usuário atualizado: ${user.email}`);
        } else {
          // Criar novo usuário
          await client.query(
            'INSERT INTO usuarios (nome, email, senha_hash, nivel, ativo, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
            [user.nome, user.email, senhaHash, user.nivel, true]
          );
          console.log(`✅ Usuário criado: ${user.email}`);
        }

        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Senha: ${user.senha}`);
        console.log(`   👤 Nível: ${user.nivel}`);
        console.log('');

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${user.email}:`, error.message);
      }
    }

    // Verificar usuários criados
    console.log('📋 Verificando usuários no banco...');
    const result = await client.query('SELECT nome, email, nivel, ativo FROM usuarios ORDER BY created_at');
    
    console.log('\n👥 Usuários no banco:');
    result.rows.forEach(user => {
      console.log(`   • ${user.nome} (${user.email}) - ${user.nivel} - ${user.ativo ? 'Ativo' : 'Inativo'}`);
    });

    console.log('\n🎯 CREDENCIAIS PARA TESTE NO INSOMNIA:');
    console.log('=====================================');
    users.forEach(user => {
      console.log(`📧 ${user.email}`);
      console.log(`🔑 ${user.senha}`);
      console.log('');
    });

  } catch (error) {
    console.error('💥 Erro de conexão:', error.message);
    console.log('\n🔧 Possíveis soluções:');
    console.log('1. Verificar se o banco está rodando');
    console.log('2. Verificar configurações no .env');
    console.log('3. Executar migrations: npm run migrate');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar
testConnectionAndCreateUsers();
