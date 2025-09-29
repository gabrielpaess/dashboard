#!/usr/bin/env node

/**
 * Script para testar conexão com o banco de dados específico
 * Testa a conexão com o banco 'meus_pedidos' e usuário 'api_user'
 */

const dotenv = require('dotenv');
const path = require('path');
const { Pool, Client } = require('pg');

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
console.log(`🔍 Carregando variáveis de ambiente de: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error);
  console.log('💡 Dica: Crie o arquivo .env com as configurações do banco');
  process.exit(1);
} else {
  console.log('✅ Variáveis de ambiente carregadas com sucesso');
}

// Configuração específica para seu banco
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'meus_pedidos',
  user: process.env.DB_USER || 'api_user',
  password: process.env.DB_PASSWORD || 'Pontoplacas25-'
};

console.log('\n📊 Configuração do banco que será testada:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'não definido'}`);

async function testConnection() {
  console.log('\n🔌 Testando conexão com o banco de dados...');
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    console.log('✅ Conexão com banco estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, current_database() as database_name');
    console.log('📅 Informações do banco:');
    console.log(`   Hora atual: ${result.rows[0].current_time}`);
    console.log(`   Nome do banco: ${result.rows[0].database_name}`);
    
    // Verificar se as tabelas existem
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    const tables = await client.query(tablesQuery);
    console.log(`\n📊 Tabelas encontradas: ${tables.rows.length}`);
    
    if (tables.rows.length > 0) {
      console.log('   Tabelas:');
      tables.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Nenhuma tabela encontrada. Execute as migrations.');
    }
    
    // Verificar permissões
    console.log('\n🔐 Verificando permissões...');
    try {
      await client.query('CREATE TABLE test_permissions (id SERIAL PRIMARY KEY)');
      await client.query('DROP TABLE test_permissions');
      console.log('✅ Permissões de CREATE/DROP: OK');
    } catch (error) {
      console.log('⚠️  Permissões limitadas:', error.message);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco:', error.message);
    console.log('\n🔍 Possíveis soluções:');
    console.log('   1. Verifique se o PostgreSQL está rodando');
    console.log('   2. Verifique se o usuário e senha estão corretos');
    console.log('   3. Verifique se o banco "meus_pedidos" existe');
    console.log('   4. Verifique se o usuário "api_user" tem permissões');
    
    await pool.end();
    process.exit(1);
  }
}

async function testWithDifferentConfigs() {
  console.log('\n🔄 Testando diferentes configurações...');
  
  const configs = [
    {
      name: 'Configuração do .env',
      config: dbConfig
    },
    {
      name: 'Configuração hardcoded',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'meus_pedidos',
        user: 'api_user',
        password: 'Pontoplacas25-'
      }
    }
  ];
  
  for (const { name, config } of configs) {
    console.log(`\n📋 Testando: ${name}`);
    const pool = new Pool(config);
    
    try {
      const client = await pool.connect();
      console.log(`✅ ${name}: Conexão OK`);
      client.release();
      await pool.end();
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      await pool.end();
    }
  }
}

async function main() {
  try {
    console.log('🚀 Testando conexão com banco de dados...\n');
    
    // Testar configuração do .env
    await testConnection();
    
    // Testar configurações alternativas
    await testWithDifferentConfigs();
    
    console.log('\n✅ Todos os testes concluídos!');
    
  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error.message);
    process.exit(1);
  }
}

main();
