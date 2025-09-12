#!/usr/bin/env node

/**
 * Script para limpar caches da aplicação
 * Remove arquivos de cache que podem estar causando problemas
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const projectRoot = process.cwd();

console.log('🧹 Limpando caches da aplicação...\n');

// Função para remover diretório recursivamente
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dirPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao remover ${dirPath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

// Função para remover arquivo
function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${filePath}`);
      return true;
    } catch (error) {
      console.log(`❌ Erro ao remover ${filePath}: ${error.message}`);
      return false;
    }
  }
  return false;
}

async function clearCaches() {
  let removedCount = 0;

  console.log('📁 Limpando caches do Vite...');
  
  // Caches do Vite
  const viteCaches = [
    'node_modules/.vite',
    '.vite',
    'dist',
    'build'
  ];

  for (const cache of viteCaches) {
    const cachePath = path.join(projectRoot, cache);
    if (removeDirectory(cachePath)) {
      removedCount++;
    }
  }

  console.log('\n📁 Limpando caches do Node.js...');
  
  // Caches do Node.js
  const nodeCaches = [
    'node_modules/.cache',
    '.cache',
    'npm-cache',
    '.npm'
  ];

  for (const cache of nodeCaches) {
    const cachePath = path.join(projectRoot, cache);
    if (removeDirectory(cachePath)) {
      removedCount++;
    }
  }

  console.log('\n📁 Limpando arquivos temporários...');
  
  // Arquivos temporários
  const tempFiles = [
    'vite.config.js.timestamp-*.mjs',
    '*.tmp',
    '*.temp',
    '.DS_Store',
    'Thumbs.db'
  ];

  for (const pattern of tempFiles) {
    try {
      const files = execSync(`Get-ChildItem -Path "${projectRoot}" -Recurse -Force -Name "${pattern}"`, { 
        shell: 'powershell',
        encoding: 'utf8'
      }).trim().split('\n').filter(f => f.trim());
      
      for (const file of files) {
        const filePath = path.join(projectRoot, file);
        if (removeFile(filePath)) {
          removedCount++;
        }
      }
    } catch (error) {
      // Ignorar erros de arquivos não encontrados
    }
  }

  console.log('\n📁 Limpando cache do localStorage...');
  
  // Limpar localStorage (simulado)
  console.log('💡 Para limpar o cache do browser:');
  console.log('   1. Abra o DevTools (F12)');
  console.log('   2. Vá para Application > Storage');
  console.log('   3. Clique em "Clear storage"');
  console.log('   4. Ou execute: localStorage.clear() no console');

  console.log('\n📁 Limpando cache do Supabase...');
  
  // Cache do Supabase (se existir)
  const supabaseCache = path.join(projectRoot, '.supabase');
  if (removeDirectory(supabaseCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do Tailwind...');
  
  // Cache do Tailwind
  const tailwindCache = path.join(projectRoot, 'node_modules/.cache/tailwindcss');
  if (removeDirectory(tailwindCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do PostCSS...');
  
  // Cache do PostCSS
  const postcssCache = path.join(projectRoot, 'node_modules/.cache/postcss');
  if (removeDirectory(postcssCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do Babel...');
  
  // Cache do Babel
  const babelCache = path.join(projectRoot, 'node_modules/.cache/babel');
  if (removeDirectory(babelCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do ESLint...');
  
  // Cache do ESLint
  const eslintCache = path.join(projectRoot, 'node_modules/.cache/eslint');
  if (removeDirectory(eslintCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do TypeScript...');
  
  // Cache do TypeScript
  const tsCache = path.join(projectRoot, 'node_modules/.cache/typescript');
  if (removeDirectory(tsCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando cache do pnpm...');
  
  // Cache do pnpm
  const pnpmCache = path.join(projectRoot, 'node_modules/.pnpm/.cache');
  if (removeDirectory(pnpmCache)) {
    removedCount++;
  }

  console.log('\n📁 Limpando arquivos de lock antigos...');
  
  // Arquivos de lock antigos
  const lockFiles = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ];

  for (const lockFile of lockFiles) {
    const lockPath = path.join(projectRoot, lockFile);
    if (fs.existsSync(lockPath)) {
      console.log(`ℹ️  Mantendo: ${lockFile} (necessário para dependências)`);
    }
  }

  console.log('\n📁 Limpando cache do sistema...');
  
  // Limpar cache do sistema (Windows)
  try {
    execSync('ipconfig /flushdns', { stdio: 'ignore' });
    console.log('✅ Cache DNS limpo');
  } catch (error) {
    console.log('ℹ️  Não foi possível limpar cache DNS');
  }

  console.log('\n✅ Limpeza de cache concluída!');
  console.log(`📊 Total de itens removidos: ${removedCount}`);
  
  console.log('\n🎯 Próximos passos:');
  console.log('1. Execute: npm install (para reinstalar dependências)');
  console.log('2. Execute: npm run start:full');
  console.log('3. Limpe o cache do browser (F12 > Application > Clear storage)');
  console.log('4. Teste o login novamente');

  console.log('\n💡 Se o problema persistir:');
  console.log('- Verifique o console do browser (F12)');
  console.log('- Verifique se a tabela "usuarios" existe no Supabase');
  console.log('- Execute: npm run test:dashboard');
}

clearCaches().catch(console.error);
