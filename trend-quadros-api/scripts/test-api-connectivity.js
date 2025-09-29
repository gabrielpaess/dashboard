#!/usr/bin/env node

/**
 * Script para testar conectividade da API
 * Testa se a API está acessível pelo IP da VPS
 */

const axios = require('axios');

const VPS_IP = '168.231.90.41';
const API_PORT = 3001;
const API_BASE_URL = `http://${VPS_IP}:${API_PORT}`;

console.log('🌐 Testando conectividade da API...\n');
console.log(`📍 IP da VPS: ${VPS_IP}`);
console.log(`🔌 Porta da API: ${API_PORT}`);
console.log(`🔗 URL da API: ${API_BASE_URL}\n`);

async function testEndpoint(endpoint, description) {
  try {
    console.log(`🔍 Testando: ${description}`);
    console.log(`   URL: ${API_BASE_URL}${endpoint}`);
    
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'API-Connectivity-Test'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Resposta: ${JSON.stringify(response.data, null, 2)}\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   💡 Possível causa: API não está rodando ou porta não está aberta\n`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`   💡 Possível causa: Firewall bloqueando ou API lenta\n`);
    } else {
      console.log(`   💡 Possível causa: ${error.message}\n`);
    }
    return false;
  }
}

async function testPostEndpoint(endpoint, data, description) {
  try {
    console.log(`🔍 Testando: ${description}`);
    console.log(`   URL: ${API_BASE_URL}${endpoint}`);
    
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Connectivity-Test'
      }
    });
    
    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📊 Resposta: ${JSON.stringify(response.data, null, 2)}\n`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    if (error.response) {
      console.log(`   📊 Status da resposta: ${error.response.status}`);
      console.log(`   📊 Dados da resposta: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    console.log(`   💡 Possível causa: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando testes de conectividade...\n');
  
  const results = [];
  
  // Teste 1: Health Check
  results.push(await testEndpoint('/health', 'Health Check'));
  
  // Teste 2: Documentação da API
  results.push(await testEndpoint('/api/docs', 'Documentação da API'));
  
  // Teste 3: Endpoint de autenticação
  results.push(await testEndpoint('/api/auth', 'Endpoint de Autenticação'));
  
  // Teste 4: Login (se a API estiver funcionando)
  if (results[0]) { // Se health check passou
    results.push(await testPostEndpoint('/api/auth/login', {
      email: 'admin@pontoquadros.com',
      password: 'admin123'
    }, 'Teste de Login'));
  }
  
  // Teste 5: Status da sincronização
  if (results[0]) { // Se health check passou
    results.push(await testEndpoint('/api/sync/status', 'Status da Sincronização'));
  }
  
  // Resumo dos resultados
  console.log('📊 RESUMO DOS TESTES:');
  console.log('====================');
  
  const passedTests = results.filter(r => r).length;
  const totalTests = results.length;
  
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Todos os testes passaram! A API está funcionando perfeitamente.');
    console.log('\n🔗 URLs disponíveis:');
    console.log(`   Health Check: ${API_BASE_URL}/health`);
    console.log(`   Documentação: ${API_BASE_URL}/api/docs`);
    console.log(`   Autenticação: ${API_BASE_URL}/api/auth`);
    console.log(`   Pedidos: ${API_BASE_URL}/api/orders`);
    console.log(`   Sincronização: ${API_BASE_URL}/api/sync`);
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique:');
    console.log('   1. Se a API está rodando (pm2 status)');
    console.log('   2. Se a porta 3001 está aberta (netstat -tlnp | grep :3001)');
    console.log('   3. Se o firewall está configurado (sudo ufw status)');
    console.log('   4. Se o CORS está configurado corretamente');
  }
  
  console.log('\n💡 Para configurar o frontend:');
  console.log(`   const API_BASE_URL = '${API_BASE_URL}/api';`);
}

main().catch(error => {
  console.error('💥 Erro durante os testes:', error.message);
  process.exit(1);
});
