#!/usr/bin/env node

/**
 * Script para Testar Conectividade da API
 * 
 * Este script testa se as APIs estão funcionando corretamente
 * antes de executar a sincronização.
 */

import { TinyApiClient } from './src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from './src/services/pedidosCentralizedService.js';

console.log('🧪 Testando Conectividade das APIs...\n');

async function testTinyAPI() {
  console.log('1️⃣ Testando API Tiny...');
  
  try {
    const tinyClient = new TinyApiClient();
    
    // Testar busca de pedidos
    console.log('   📡 Testando busca de pedidos...');
    const response = await tinyClient.fetchOrders({ 
      pagina: 1,
      registrosPorPagina: 5,
      useCache: false
    });
    
    if (response.success) {
      console.log(`   ✅ API Tiny funcionando - ${response.data?.length || 0} pedidos encontrados`);
      return true;
    } else {
      console.log(`   ❌ API Tiny com erro: ${response.error}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro na API Tiny: ${error.message}`);
    return false;
  }
}

async function testSupabase() {
  console.log('\n2️⃣ Testando Supabase...');
  
  try {
    // Testar busca de pedidos existentes
    console.log('   📡 Testando busca de pedidos no Supabase...');
    const pedidos = await pedidosCentralizedService.getPedidos();
    
    if (Array.isArray(pedidos)) {
      console.log(`   ✅ Supabase funcionando - ${pedidos.length} pedidos no banco`);
      return true;
    } else {
      console.log(`   ❌ Supabase retornou dados inválidos`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no Supabase: ${error.message}`);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('\n3️⃣ Testando Variáveis de Ambiente...');
  
  const requiredVars = [
    'VITE_TINY_API_TOKEN',
    'VITE_TINY_API_URL',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: Configurada`);
    } else {
      console.log(`   ❌ ${varName}: Não configurada`);
      allPresent = false;
    }
  }
  
  return allPresent;
}

async function testSyncEndpoint() {
  console.log('\n4️⃣ Testando Endpoint de Sincronização...');
  
  try {
    const baseUrl = process.env.VERCEL_URL || 'https://dashboard-zeta-three-34.vercel.app';
    const syncUrl = `${baseUrl}/api/sync-manual`;
    
    console.log(`   📡 Testando: ${syncUrl}`);
    
    const response = await fetch(syncUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'TestScript/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Endpoint funcionando - Status: ${response.status}`);
      console.log(`   📊 Resposta:`, data);
      return true;
    } else {
      console.log(`   ❌ Endpoint com erro - Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   📋 Erro: ${errorText}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ❌ Erro no endpoint: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Iniciando testes de conectividade...\n');
  
  const results = {
    environment: await testEnvironmentVariables(),
    tiny: await testTinyAPI(),
    supabase: await testSupabase(),
    endpoint: await testSyncEndpoint()
  };
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    const testName = {
      environment: 'Variáveis de Ambiente',
      tiny: 'API Tiny',
      supabase: 'Supabase',
      endpoint: 'Endpoint de Sincronização'
    }[test];
    
    console.log(`${status} ${testName}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    console.log('\n🎉 Todos os testes passaram! O sistema está funcionando.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique as configurações.');
    
    if (!results.environment) {
      console.log('\n💡 Dica: Configure as variáveis de ambiente na Vercel');
    }
    if (!results.tiny) {
      console.log('\n💡 Dica: Verifique o token da API Tiny');
    }
    if (!results.supabase) {
      console.log('\n💡 Dica: Verifique as credenciais do Supabase');
    }
    if (!results.endpoint) {
      console.log('\n💡 Dica: Verifique se o dashboard está deployado');
    }
  }
  
  return allPassed;
}

// Executar testes
main().catch(console.error);
