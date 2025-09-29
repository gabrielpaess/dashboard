#!/usr/bin/env node

/**
 * Script para criar usuários com configurações corretas do banco
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configurações corretas do banco (baseadas no que o usuário criou)
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

async function createUsers() {
  let client;
  
  try {
    console.log('🔌 Conectando ao banco meus_pedidos...');
    console.log('   Host: localhost');
    console.log('   Port: 5432');
    console.log('   Database: meus_pedidos');
    console.log('   User: api_user');
    console.log('');

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
      console.log('💡 Criando tabela usuarios...');
      
      // Criar tabela usuarios
      await client.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          nivel VARCHAR(50) NOT NULL DEFAULT 'user',
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Tabela "usuarios" criada!');
    } else {
      console.log('✅ Tabela "usuarios" existe');
    }

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

    console.log('✅ Processo concluído com sucesso!');

  } catch (error) {
    console.error('💥 Erro:', error.message);
    console.log('\n🔧 Verifique se:');
    console.log('1. O PostgreSQL está rodando');
    console.log('2. O banco "meus_pedidos" existe');
    console.log('3. O usuário "api_user" tem permissões');
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Executar
createUsers();
