#!/usr/bin/env node

/**
 * Script para Configurar Webhook de Sincronização
 * 
 * Este script ajuda a configurar um webhook externo (como Zapier, IFTTT, ou cron externo)
 * para chamar a sincronização manual mais frequentemente, contornando as limitações
 * do plano gratuito da Vercel.
 * 
 * Uso: node scripts/setup-webhook-sync.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Configurando Webhook de Sincronização...\n');

// URLs dos endpoints
const baseUrl = process.env.VERCEL_URL || 'https://dashboard-zeta-three-34.vercel.app/';
const syncUrl = `${baseUrl}/api/sync`;
const manualSyncUrl = `${baseUrl}/api/sync-manual`;

console.log('📋 URLs dos Endpoints:');
console.log(`   Sincronização Diária: ${syncUrl}`);
console.log(`   Sincronização Manual: ${manualSyncUrl}\n`);

// Configurações para diferentes serviços
const webhookConfigs = {
  zapier: {
    name: 'Zapier',
    description: 'Automatizar sincronização via Zapier',
    setup: [
      '1. Acesse zapier.com e crie uma conta',
      '2. Crie um novo Zap',
      '3. Escolha um trigger (ex: Schedule by Zapier)',
      '4. Configure para executar a cada 2-4 horas',
      '5. Adicione uma ação "Webhooks by Zapier"',
      `6. Configure a URL: ${manualSyncUrl}`,
      '7. Método: GET',
      '8. Teste e ative o Zap'
    ]
  },
  
  ifttt: {
    name: 'IFTTT',
    description: 'Automatizar sincronização via IFTTT',
    setup: [
      '1. Acesse ifttt.com e crie uma conta',
      '2. Crie um novo Applet',
      '3. Escolha "Date & Time" como trigger',
      '4. Configure para executar a cada 2-4 horas',
      '5. Escolha "Webhooks" como ação',
      `6. Configure a URL: ${manualSyncUrl}`,
      '7. Método: GET',
      '8. Teste e ative o Applet'
    ]
  },
  
  cronJob: {
    name: 'Cron Job Externo',
    description: 'Usar serviço de cron job externo',
    setup: [
      '1. Use um serviço como cron-job.org ou setcronjob.com',
      '2. Crie uma nova tarefa',
      `3. Configure a URL: ${manualSyncUrl}`,
      '4. Configure para executar a cada 2-4 horas',
      '5. Método: GET',
      '6. Ative a tarefa'
    ]
  },
  
  githubActions: {
    name: 'GitHub Actions',
    description: 'Usar GitHub Actions para sincronização',
    setup: [
      '1. Crie um arquivo .github/workflows/sync.yml',
      '2. Configure para executar a cada 2-4 horas',
      `3. Use curl para chamar: ${manualSyncUrl}`,
      '4. Commit e push para o repositório'
    ]
  }
};

// Mostrar configurações
Object.entries(webhookConfigs).forEach(([key, config]) => {
  console.log(`🔗 ${config.name}:`);
  console.log(`   ${config.description}`);
  config.setup.forEach(step => {
    console.log(`   ${step}`);
  });
  console.log('');
});

// Criar arquivo de configuração
const configData = {
  endpoints: {
    daily: syncUrl,
    manual: manualSyncUrl
  },
  schedules: {
    daily: '0 6 * * * (6:00 AM UTC)',
    recommended: '0 */4 * * * (A cada 4 horas)',
    frequent: '0 */2 * * * (A cada 2 horas)'
  },
  limits: {
    vercelHobby: '1 cron job, 1x por dia',
    manual: 'Sem limite (via webhook externo)'
  },
  webhookConfigs
};

const configPath = path.join(__dirname, '..', 'webhook-sync-config.json');
fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

console.log('📄 Configuração salva em: webhook-sync-config.json\n');

// Criar script de teste
const testScript = `#!/bin/bash

# Script de Teste para Sincronização
# Uso: ./test-sync.sh

echo "🧪 Testando sincronização..."

# Testar sincronização manual
echo "📞 Chamando sincronização manual..."
curl -X GET "${manualSyncUrl}" \\
  -H "Content-Type: application/json" \\
  -w "\\nStatus: %{http_code}\\nTempo: %{time_total}s\\n" \\
  -s

echo "\\n✅ Teste concluído!"
`;

const testScriptPath = path.join(__dirname, '..', 'test-sync.sh');
fs.writeFileSync(testScriptPath, testScript);

// Tornar o script executável (Unix/Linux)
if (process.platform !== 'win32') {
  try {
    fs.chmodSync(testScriptPath, '755');
  } catch (error) {
    console.log('⚠️ Não foi possível tornar o script executável');
  }
}

console.log('🧪 Script de teste criado: test-sync.sh\n');

// Mostrar resumo
console.log('📊 Resumo da Configuração:');
console.log(`   ✅ Cron Job Diário: ${syncUrl} (6:00 AM UTC)`);
console.log(`   ✅ Sincronização Manual: ${manualSyncUrl} (sem limite)`);
console.log(`   ✅ Configuração: webhook-sync-config.json`);
console.log(`   ✅ Script de Teste: test-sync.sh\n`);

console.log('💡 Recomendações:');
console.log('   1. Use o cron job diário para sincronização completa');
console.log('   2. Configure um webhook externo para sincronização mais frequente');
console.log('   3. Teste os endpoints antes de configurar webhooks');
console.log('   4. Monitore os logs da Vercel para verificar execução\n');

console.log('🚀 Próximos passos:');
console.log('   1. Faça deploy na Vercel');
console.log('   2. Teste os endpoints');
console.log('   3. Configure um webhook externo');
console.log('   4. Monitore a execução');
