#!/usr/bin/env node

/**
 * Script para Configurar GitHub Actions
 * 
 * Este script ajuda a configurar o GitHub Actions
 * para sincronização automática do dashboard.
 * 
 * Uso: node scripts/setup-github-actions.js
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

console.log('🚀 Configurando GitHub Actions para Sincronização...\n');

// Verificar se estamos em um repositório Git
try {
  execSync('git status', { stdio: 'pipe' });
  console.log('✅ Repositório Git detectado');
} catch (error) {
  console.log('❌ Erro: Não estamos em um repositório Git');
  console.log('💡 Execute: git init && git remote add origin <seu-repositorio>');
  process.exit(1);
}

// Verificar se o arquivo de workflow existe
const workflowPath = '.github/workflows/sync.yml';
if (!fs.existsSync(workflowPath)) {
  console.log('❌ Erro: Arquivo de workflow não encontrado');
  console.log('💡 Execute: npm run setup:webhook primeiro');
  process.exit(1);
}

console.log('✅ Arquivo de workflow encontrado');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📋 Configuração do GitHub Actions:');
console.log('='.repeat(50));

rl.question('🌐 Digite a URL do seu dashboard na Vercel (ex: https://dashboard-trend-quadros.vercel.app): ', (url) => {
  if (!url || !url.includes('vercel.app')) {
    console.log('❌ URL inválida. Use o formato: https://dashboard-zeta-three-34.vercel.app/');
    rl.close();
    process.exit(1);
  }

  // Remover barra final se existir
  const cleanUrl = url.replace(/\/$/, '');
  
  console.log(`\n🔧 Configurando URL: ${cleanUrl}`);

  // Atualizar o arquivo de workflow
  try {
    let workflowContent = fs.readFileSync(workflowPath, 'utf8');
    
    // Substituir a URL
    workflowContent = workflowContent.replace(
      'SYNC_URL="https://dashboard-zeta-three-34.vercel.app/api/sync-manual"',
      `SYNC_URL="${cleanUrl}/api/sync-manual"`
    );
    
    fs.writeFileSync(workflowPath, workflowContent);
    console.log('✅ URL atualizada no workflow');
    
  } catch (error) {
    console.log('❌ Erro ao atualizar workflow:', error.message);
    rl.close();
    process.exit(1);
  }

  // Verificar se há mudanças para commit
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      console.log('\n📝 Mudanças detectadas:');
      console.log(gitStatus);
      
      rl.question('\n❓ Deseja fazer commit e push das mudanças? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          try {
            // Fazer commit
            execSync('git add .github/workflows/sync.yml', { stdio: 'inherit' });
            execSync('git commit -m "Configure GitHub Actions sync workflow"', { stdio: 'inherit' });
            
            console.log('\n✅ Commit realizado com sucesso!');
            console.log('📤 Execute: git push origin main');
            console.log('🔗 Depois acesse: https://github.com/seu-usuario/seu-repositorio/actions');
            
          } catch (error) {
            console.log('❌ Erro no commit:', error.message);
          }
        } else {
          console.log('⏭️  Commit cancelado. Execute manualmente:');
          console.log('   git add .github/workflows/sync.yml');
          console.log('   git commit -m "Configure GitHub Actions sync workflow"');
          console.log('   git push origin main');
        }
        
        rl.close();
        showNextSteps(cleanUrl);
      });
    } else {
      console.log('✅ Nenhuma mudança detectada');
      rl.close();
      showNextSteps(cleanUrl);
    }
    
  } catch (error) {
    console.log('❌ Erro ao verificar status do Git:', error.message);
    rl.close();
  }
});

function showNextSteps(url) {
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('='.repeat(50));
  
  console.log('\n1️⃣  Fazer Push para o GitHub:');
  console.log('   git push origin main');
  
  console.log('\n2️⃣  Verificar Actions:');
  console.log(`   https://github.com/seu-usuario/seu-repositorio/actions`);
  
  console.log('\n3️⃣  Testar Execução Manual:');
  console.log('   - Acesse a aba "Actions" no GitHub');
  console.log('   - Clique em "Sync Dashboard Data"');
  console.log('   - Clique em "Run workflow"');
  console.log('   - Selecione branch "main" e clique "Run workflow"');
  
  console.log('\n4️⃣  Verificar Logs:');
  console.log('   - Clique na execução para ver logs detalhados');
  console.log('   - Verifique se a sincronização foi bem-sucedida');
  
  console.log('\n5️⃣  Configuração Automática:');
  console.log('   - O workflow executará automaticamente a cada 4 horas');
  console.log('   - Horários: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC');
  
  console.log('\n6️⃣  Monitoramento:');
  console.log(`   - Dashboard: ${url}`);
  console.log('   - Logs: GitHub Actions > Sync Dashboard Data');
  console.log('   - Status: Verde = Sucesso, Vermelho = Falha');
  
  console.log('\n💡 DICAS:');
  console.log('   - O workflow executa no horário UTC');
  console.log('   - Você pode executar manualmente a qualquer momento');
  console.log('   - Configure notificações no GitHub para falhas');
  console.log('   - Monitore os logs para verificar execução');
  
  console.log('\n🎉 Configuração concluída!');
  console.log('   Seu dashboard será sincronizado automaticamente a cada 4 horas.');
}
