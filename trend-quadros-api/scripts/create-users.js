#!/usr/bin/env node

/**
 * Script para criar usuários com senhas específicas
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

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

async function createUsers() {
  try {
    console.log('🔐 Criando usuários com senhas específicas...\n');

    // Conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

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
        console.log(`   🔐 Hash: ${senhaHash.substring(0, 20)}...`);
        console.log('');

      } catch (error) {
        console.error(`❌ Erro ao criar usuário ${user.email}:`, error.message);
      }
    }

    // Verificar usuários criados
    console.log('📋 Verificando usuários no banco...');
    const result = await client.query('SELECT nome, email, nivel, ativo FROM usuarios ORDER BY created_at');
    
    console.log('\n👥 Usuários no banco:');
    result.rows.forEach(user => {
      console.log(`   • ${user.nome} (${user.email}) - ${user.nivel} - ${user.ativo ? 'Ativo' : 'Inativo'}`);
    });

    client.release();
    console.log('\n✅ Processo concluído!');

  } catch (error) {
    console.error('💥 Erro:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar
createUsers();
