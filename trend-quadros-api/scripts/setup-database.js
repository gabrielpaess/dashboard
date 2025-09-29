#!/usr/bin/env node

/**
 * Script para configurar o banco de dados
 * Cria o banco se não existir e executa as migrations
 */

const dotenv = require('dotenv');
const path = require('path');
const { Pool, Client } = require('pg');

// Load environment variables - garantir que encontre o arquivo .env
const envPath = path.join(process.cwd(), '.env');
console.log(`🔍 Carregando variáveis de ambiente de: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error);
  process.exit(1);
} else {
  console.log('✅ Variáveis de ambiente carregadas com sucesso');
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

console.log('\n📊 Configuração do banco:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

async function createDatabaseIfNotExists() {
  console.log('\n🔍 Verificando se o banco de dados existe...');
  
  // Conectar ao banco postgres para criar o banco se necessário
  const adminConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: 'postgres', // Conectar ao banco padrão
    user: dbConfig.user,
    password: dbConfig.password
  };

  const adminClient = new Client(adminConfig);
  
  try {
    await adminClient.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Verificar se o banco existe
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    
    const dbExists = await adminClient.query(checkDbQuery, [dbConfig.database]);
    
    if (dbExists.rows.length > 0) {
      console.log(`✅ Banco de dados '${dbConfig.database}' já existe`);
    } else {
      console.log(`📦 Criando banco de dados '${dbConfig.database}'...`);
      
      // Criar o banco
      await adminClient.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`✅ Banco de dados '${dbConfig.database}' criado com sucesso!`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar/criar banco:', error.message);
    throw error;
  } finally {
    await adminClient.end();
  }
}

async function testConnection() {
  console.log('\n🔌 Testando conexão com o banco de dados...');
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com banco estabelecida com sucesso!');
    
    // Verificar se as tabelas existem
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tables = await client.query(tablesQuery);
    console.log(`📊 Tabelas encontradas: ${tables.rows.length}`);
    
    if (tables.rows.length > 0) {
      console.log('   Tabelas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada. Execute as migrations.');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error.message);
    await pool.end();
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Configurando banco de dados...\n');
    
    // 1. Criar banco se não existir
    await createDatabaseIfNotExists();
    
    // 2. Testar conexão
    await testConnection();
    
    console.log('\n✅ Configuração do banco concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Execute: npm run migrate:prod');
    console.log('   2. Execute: npm run test:sync');
    console.log('   3. Execute: npm run sync:initial');
    
  } catch (error) {
    console.error('\n💥 Erro na configuração do banco:', error.message);
    process.exit(1);
  }
}

main();
