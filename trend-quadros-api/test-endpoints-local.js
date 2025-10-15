const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testApiEndpoints() {
  console.log('🔗 Testando endpoints específicos da API...\n');

  let token = null;

  try {
    // Login para obter token
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'williaamtelles@gmail.com',
      password: 'Pontoink2025!'
    });
    
    token = loginResponse.data.access_token;
    console.log('✅ Login realizado com sucesso!');
    console.log('');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Teste 1: Health Check (público)
    console.log('1️⃣ Testando /health (público)...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Teste 2: Dashboard Overview
    console.log('2️⃣ Testando /api/dashboard/overview...');
    const overviewResponse = await axios.get(`${API_BASE_URL}/api/dashboard/overview`, { headers });
    console.log('✅ Overview:', {
      success: overviewResponse.data.success,
      totalPedidos: overviewResponse.data.data?.totalPedidos,
      totalRevenue: overviewResponse.data.data?.totalRevenue
    });
    console.log('');

    // Teste 3: Dashboard Sales
    console.log('3️⃣ Testando /api/dashboard/sales...');
    const salesResponse = await axios.get(`${API_BASE_URL}/api/dashboard/sales`, { headers });
    console.log('✅ Sales:', {
      success: salesResponse.data.success,
      daily: salesResponse.data.data?.daily,
      weekly: salesResponse.data.data?.weekly,
      monthly: salesResponse.data.data?.monthly
    });
    console.log('');

    // Teste 4: Dashboard Production
    console.log('4️⃣ Testando /api/dashboard/production...');
    const productionResponse = await axios.get(`${API_BASE_URL}/api/dashboard/production`, { headers });
    console.log('✅ Production:', {
      success: productionResponse.data.success,
      wipPedidos: productionResponse.data.data?.wip?.totalPedidos,
      itemsInProduction: productionResponse.data.data?.itemsInProduction
    });
    console.log('');

    // Teste 5: Dashboard After Sales
    console.log('5️⃣ Testando /api/dashboard/after-sales...');
    const afterSalesResponse = await axios.get(`${API_BASE_URL}/api/dashboard/after-sales`, { headers });
    console.log('✅ After Sales:', {
      success: afterSalesResponse.data.success,
      alerts: afterSalesResponse.data.data?.alerts?.length || 0
    });
    console.log('');

    // Teste 6: Orders
    console.log('6️⃣ Testando /api/orders...');
    const ordersResponse = await axios.get(`${API_BASE_URL}/api/orders`, { headers });
    console.log('✅ Orders:', {
      success: true,
      total: ordersResponse.data.length,
      sample: ordersResponse.data.slice(0, 2).map(p => ({
        numero: p.numero,
        situacao: p.situacao,
        nome_cliente: p.nome_cliente
      }))
    });
    console.log('');

    // Teste 7: Sync Status
    console.log('7️⃣ Testando /api/sync/status...');
    const syncResponse = await axios.get(`${API_BASE_URL}/api/sync/status`, { headers });
    console.log('✅ Sync Status:', syncResponse.data);
    console.log('');

    // Teste 8: User Profile
    console.log('8️⃣ Testando /api/auth/me...');
    const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
    console.log('✅ User Profile:', {
      success: profileResponse.data.success,
      user: profileResponse.data.data?.nome,
      email: profileResponse.data.data?.email,
      nivel: profileResponse.data.data?.nivel
    });
    console.log('');

    console.log('🎉 Todos os endpoints testados com sucesso!');
    console.log('📋 Resumo dos testes:');
    console.log('   ✅ Health Check (público)');
    console.log('   ✅ Dashboard Overview');
    console.log('   ✅ Dashboard Sales');
    console.log('   ✅ Dashboard Production');
    console.log('   ✅ Dashboard After Sales');
    console.log('   ✅ Orders');
    console.log('   ✅ Sync Status');
    console.log('   ✅ User Profile');

  } catch (error) {
    console.error('❌ Erro no teste de endpoints:', error.message);
    if (error.response) {
      console.error('📊 Detalhes do erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
  }
}

// Executar testes
testApiEndpoints();









