#!/usr/bin/env node

/**
 * Script para testar conectividade entre frontend e API da VPS
 * Testa se o frontend consegue acessar a API da VPS
 */

const axios = require('axios');

const VPS_IP = '168.231.90.41';
const API_PORT = 3001;
const API_BASE_URL = `http://${VPS_IP}:${API_PORT}`;

console.log('🌐 Testando conectividade Frontend -> API VPS...\n');
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
        'User-Agent': 'Frontend-Connectivity-Test',
        'Origin': 'http://localhost:5173' // Simular requisição do frontend
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
    } else if (error.response?.status === 403) {
      console.log(`   💡 Possível causa: CORS bloqueando requisições do frontend\n`);
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
        'User-Agent': 'Frontend-Connectivity-Test',
        'Origin': 'http://localhost:5173' // Simular requisição do frontend
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

async function testCORS() {
  console.log('🔍 Testando CORS...');
  
  try {
    // Simular requisição do frontend com diferentes origins
    const origins = [
      'http://localhost:5173',
      'https://seu-dominio.vercel.app',
      'http://168.231.90.41:5173'
    ];
    
    for (const origin of origins) {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`, {
          headers: {
            'Origin': origin,
            'User-Agent': 'Frontend-Connectivity-Test'
          }
        });
        console.log(`   ✅ CORS OK para: ${origin}`);
      } catch (error) {
        console.log(`   ❌ CORS bloqueado para: ${origin} - ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro no teste de CORS: ${error.message}`);
  }
  
  console.log('');
}

async function main() {
  console.log('🚀 Iniciando testes de conectividade Frontend -> API...\n');
  
  const results = [];
  
  // Teste 1: Health Check
  results.push(await testEndpoint('/health', 'Health Check'));
  
  // Teste 2: CORS
  await testCORS();
  
  // Teste 3: Documentação da API
  results.push(await testEndpoint('/api/docs', 'Documentação da API'));
  
  // Teste 4: Endpoint de autenticação
  results.push(await testEndpoint('/api/auth', 'Endpoint de Autenticação'));
  
  // Teste 5: Login (se a API estiver funcionando)
  if (results[0]) { // Se health check passou
    results.push(await testPostEndpoint('/api/auth/login', {
      email: 'admin@pontoquadros.com',
      password: 'admin123'
    }, 'Teste de Login'));
  }
  
  // Teste 6: Status da sincronização
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
    console.log('🎉 Todos os testes passaram! O frontend pode acessar a API.');
    console.log('\n🔗 URLs para configurar no frontend:');
    console.log(`   VITE_API_URL=http://${VPS_IP}:${API_PORT}`);
    console.log(`   VITE_API_BASE_URL=http://${VPS_IP}:${API_PORT}/api`);
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique:');
    console.log('   1. Se a API está rodando na VPS (pm2 status)');
    console.log('   2. Se a porta 3001 está aberta (netstat -tlnp | grep :3001)');
    console.log('   3. Se o firewall está configurado (sudo ufw status)');
    console.log('   4. Se o CORS está configurado para aceitar requisições do frontend');
    console.log('   5. Se o HOST=0.0.0.0 está configurado na API');
  }
  
  console.log('\n💡 Para configurar o frontend:');
  console.log('   1. Criar arquivo .env no frontend');
  console.log('   2. Adicionar: VITE_API_URL=http://168.231.90.41:3001');
  console.log('   3. Adicionar: VITE_API_BASE_URL=http://168.231.90.41:3001/api');
  console.log('   4. Configurar CORS na API para aceitar requisições do Vercel');
}

main().catch(error => {
  console.error('💥 Erro durante os testes:', error.message);
  process.exit(1);
});
