const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testApiConnectivity() {
  console.log('🧪 Testando conectividade da API local...\n');

  try {
    // Teste 1: Health Check
    console.log('1️⃣ Testando Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Teste 2: Login
    console.log('2️⃣ Testando Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'williaamtelles@gmail.com',
      password: 'Pontoink2025!'
    });
    console.log('✅ Login realizado:', {
      success: loginResponse.data.success,
      user: loginResponse.data.user?.nome,
      token: loginResponse.data.access_token ? 'Token recebido' : 'Sem token'
    });
    console.log('');

    const token = loginResponse.data.access_token;

    // Teste 3: Buscar Pedidos
    console.log('3️⃣ Testando busca de pedidos...');
    const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Pedidos encontrados:', ordersResponse.data.length);
    console.log('📊 Amostra dos pedidos:', ordersResponse.data.slice(0, 3).map(p => ({
      numero: p.numero,
      situacao: p.situacao,
      nome_cliente: p.nome_cliente,
      valor_total: p.valor_total
    })));
    console.log('');

    // Teste 4: Dashboard Overview
    console.log('4️⃣ Testando Dashboard Overview...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/api/dashboard/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Dashboard Overview:', {
      success: dashboardResponse.data.success,
      totalPedidos: dashboardResponse.data.data?.totalPedidos,
      totalRevenue: dashboardResponse.data.data?.totalRevenue
    });
    console.log('');

    // Teste 5: Estatísticas de Produção
    console.log('5️⃣ Testando estatísticas de produção...');
    const productionResponse = await axios.get(`${API_BASE_URL}/api/dashboard/production`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Estatísticas de Produção:', {
      success: productionResponse.data.success,
      wipPedidos: productionResponse.data.data?.wip?.totalPedidos,
      itemsInProduction: productionResponse.data.data?.itemsInProduction
    });
    console.log('');

    console.log('🎉 Todos os testes passaram com sucesso!');
    console.log('📋 Resumo:');
    console.log(`   - API rodando em: ${API_BASE_URL}`);
    console.log(`   - Health Check: ✅`);
    console.log(`   - Autenticação: ✅`);
    console.log(`   - Pedidos: ${ordersResponse.data.length} encontrados`);
    console.log(`   - Dashboard: ✅`);
    console.log(`   - Produção: ✅`);

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📊 Detalhes do erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    console.log('\n🔧 Possíveis soluções:');
    console.log('   1. Verificar se a API está rodando: npm run start:dev');
    console.log('   2. Verificar se o banco de dados está conectado');
    console.log('   3. Verificar as credenciais de login');
    console.log('   4. Verificar se a porta 3001 está livre');
  }
}

// Executar testes
testApiConnectivity();









