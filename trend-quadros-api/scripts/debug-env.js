#!/usr/bin/env node

/**
 * Script para debugar variáveis de ambiente
 * Verifica se o arquivo .env está sendo carregado corretamente
 */

const dotenv = require('dotenv');
const path = require('path');

console.log('🔍 Debugando variáveis de ambiente...\n');

// Verificar se o arquivo .env existe
const envPath = path.join(process.cwd(), '.env');
console.log(`📁 Procurando arquivo .env em: ${envPath}`);

const fs = require('fs');
if (fs.existsSync(envPath)) {
  console.log('✅ Arquivo .env encontrado');
} else {
  console.log('❌ Arquivo .env NÃO encontrado');
  console.log('📁 Arquivos na pasta atual:');
  fs.readdirSync(process.cwd()).forEach(file => {
    console.log(`   - ${file}`);
  });
}

console.log('\n🔧 Carregando variáveis de ambiente...');
const result = dotenv.config();

if (result.error) {
  console.log('❌ Erro ao carregar .env:', result.error);
} else {
  console.log('✅ .env carregado com sucesso');
}

console.log('\n📊 Variáveis de ambiente carregadas:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
console.log(`   DB_HOST: ${process.env.DB_HOST || 'não definido'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'não definido'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'não definido'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'não definido'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-4) : 'não definido'}`);
console.log(`   TINY_API_TOKEN: ${process.env.TINY_API_TOKEN ? '***' + process.env.TINY_API_TOKEN.slice(-4) : 'não definido'}`);

console.log('\n🔍 Verificando se as variáveis estão sendo usadas corretamente:');
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

console.log('📊 Configuração do banco que será usada:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'não definido'}`);

// Testar conexão com banco
console.log('\n🔌 Testando conexão com banco de dados...');
const { Pool } = require('pg');

const pool = new Pool(dbConfig);

pool.connect()
  .then(client => {
    console.log('✅ Conexão com banco estabelecida com sucesso!');
    client.release();
    pool.end();
  })
  .catch(error => {
    console.log('❌ Erro ao conectar com banco:', error.message);
    pool.end();
  });
