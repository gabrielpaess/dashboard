/**
 * Script para iniciar a API com sincronização automática
 * Configura o ambiente e inicia o servidor NestJS
 */

const { spawn } = require('child_process');
const path = require('path');

// Configurações do ambiente
const env = {
  ...process.env,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || '5432',
  DB_NAME: process.env.DB_NAME || 'dashboard',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres123',
  TINY_API_TOKEN: process.env.TINY_API_TOKEN || '',
  JWT_SECRET: process.env.JWT_SECRET || 'trend_quadros_jwt_secret_2024_super_secure_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  PORT: process.env.PORT || '3001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTO_START_SYNC: process.env.AUTO_START_SYNC || 'true'
};

console.log('🚀 Starting API with automatic sync...');
console.log(`📊 Environment: ${env.NODE_ENV}`);
console.log(`🔄 Auto-sync: ${env.AUTO_START_SYNC}`);
console.log(`⏱️  Sync interval: ${env.NODE_ENV === 'development' ? '1 minute' : '15 minutes'}`);
console.log('');

// Inicia o servidor NestJS
const server = spawn('npm', ['run', 'start:dev'], {
  env,
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`\n🛑 Server stopped with code ${code}`);
  process.exit(code);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
});
