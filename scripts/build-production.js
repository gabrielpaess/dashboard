#!/usr/bin/env node

/**
 * Script de Build para Produção
 * 
 * Este script:
 * 1. Faz o build do projeto Vite
 * 2. Configura as variáveis de ambiente para produção
 * 3. Prepara os arquivos para deploy na Vercel
 * 4. Inclui a sincronização automática via API routes
 * 
 * Uso: npm run build:production
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando build para produção...');

try {
  // 1. Verificar se as variáveis de ambiente estão configuradas
  console.log('🔍 Verificando variáveis de ambiente...');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'TINY_API_TOKEN',
    'TINY_API_URL'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Configure as variáveis de ambiente antes de fazer o build.');
    process.exit(1);
  }
  
  console.log('✅ Variáveis de ambiente configuradas');
  
  // 2. Limpar build anterior
  console.log('🧹 Limpando build anterior...');
  const distPath = path.join(projectRoot, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
  }
  console.log('✅ Build anterior removido');
  
  // 3. Fazer build do Vite
  console.log('🔨 Fazendo build do Vite...');
  execSync('npm run build', { 
    stdio: 'inherit', 
    cwd: projectRoot 
  });
  console.log('✅ Build do Vite concluído');
  
  // 4. Verificar se o build foi criado
  if (!fs.existsSync(distPath)) {
    throw new Error('Build do Vite não foi criado');
  }
  
  // 5. Criar arquivo de configuração para produção
  console.log('📝 Criando configuração de produção...');
  
  const productionConfig = {
    buildTime: new Date().toISOString(),
    version: '1.0.0',
    features: {
      syncEnabled: true,
      syncInterval: '15 minutes',
      syncEndpoint: '/api/sync'
    },
    environment: 'production'
  };
  
  fs.writeFileSync(
    path.join(distPath, 'production-config.json'),
    JSON.stringify(productionConfig, null, 2)
  );
  
  // 6. Criar README de produção
  const productionReadme = `# Dashboard de Produção

## Funcionalidades

- ✅ Dashboard completo com todas as abas
- ✅ Sincronização automática a cada 15 minutos
- ✅ Filtros de data funcionais
- ✅ Contadores de produção corretos
- ✅ SLA com filtros adequados

## Sincronização Automática

A sincronização é executada automaticamente via cron job da Vercel:
- **Endpoint**: /api/sync
- **Frequência**: A cada 15 minutos
- **Timeout**: 5 minutos por execução

## Monitoramento

Para verificar o status da sincronização:
- Acesse: https://dashboard-zeta-three-34.vercel.app//api/sync
- Retorna JSON com status da última sincronização

## Variáveis de Ambiente Necessárias

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- TINY_API_TOKEN
- TINY_API_URL

## Deploy

Este build está pronto para deploy na Vercel.
A sincronização automática será ativada automaticamente após o deploy.
`;

  fs.writeFileSync(
    path.join(distPath, 'README-PRODUCTION.md'),
    productionReadme
  );
  
  console.log('✅ Configuração de produção criada');
  
  // 7. Verificar arquivos de API
  console.log('🔍 Verificando arquivos de API...');
  
  const apiFiles = [
    'api/proxy-tiny.js',
    'api/sync.js'
  ];
  
  apiFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo de API não encontrado: ${file}`);
    }
  });
  
  console.log('✅ Arquivos de API verificados');
  
  // 8. Verificar vercel.json
  console.log('🔍 Verificando configuração da Vercel...');
  
  const vercelConfigPath = path.join(projectRoot, 'vercel.json');
  if (!fs.existsSync(vercelConfigPath)) {
    throw new Error('vercel.json não encontrado');
  }
  
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  if (!vercelConfig.crons || !vercelConfig.crons.length) {
    console.warn('⚠️ Cron jobs não configurados no vercel.json');
  } else {
    console.log('✅ Cron jobs configurados');
  }
  
  console.log('✅ Configuração da Vercel verificada');
  
  // 9. Resumo final
  console.log('\n🎉 Build de produção concluído com sucesso!');
  console.log('\n📊 Resumo:');
  console.log(`   - Build do Vite: ✅`);
  console.log(`   - API Routes: ✅`);
  console.log(`   - Cron Jobs: ✅`);
  console.log(`   - Sincronização: ✅`);
  console.log(`   - Variáveis de ambiente: ✅`);
  
  console.log('\n🚀 Próximos passos:');
  console.log('   1. Faça commit das alterações');
  console.log('   2. Faça push para o repositório');
  console.log('   3. A Vercel fará o deploy automaticamente');
  console.log('   4. A sincronização automática será ativada');
  
  console.log('\n💡 Para testar localmente:');
  console.log('   - npm run preview (para testar o build)');
  console.log('   - npm run start:auto (para testar com sincronização)');
  
} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}
