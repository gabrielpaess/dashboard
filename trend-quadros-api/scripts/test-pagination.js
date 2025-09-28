const axios = require('axios');
require('dotenv').config();

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

async function testPagination() {
  console.log('🔍 Testing Tiny API Pagination...');
  console.log(`🔑 Token: ${TINY_API_TOKEN ? '***' + TINY_API_TOKEN.slice(-4) : 'NOT SET'}`);
  
  if (!TINY_API_TOKEN) {
    console.error('❌ TINY_API_TOKEN not found in environment variables');
    process.exit(1);
  }

  try {
    let allOrders = [];
    let currentPage = 1;
    let totalPages = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`\n📄 Fetching page ${currentPage}...`);
      
      const url = new URL(TINY_API_URL);
      url.searchParams.append('token', TINY_API_TOKEN);
      url.searchParams.append('formato', 'json');
      url.searchParams.append('registrosPorPagina', '100');
      url.searchParams.append('pagina', currentPage.toString());

      const response = await axios.get(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Dashboard-API/1.0'
        },
        timeout: 15000
      });

      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'Erro') {
          const errorMessage = response.data.retorno.erros?.[0]?.erro || 'Unknown error';
          console.error('❌ Tiny API Error:', errorMessage);
          break;
        }

        const orders = response.data.retorno.pedidos || [];
        const pageInfo = response.data.retorno;
        
        console.log(`📦 Page ${currentPage}: ${orders.length} orders`);
        console.log(`📊 Total pages: ${pageInfo.numero_paginas || 'Unknown'}`);
        console.log(`📊 Current page: ${pageInfo.pagina || currentPage}`);
        
        allOrders = allOrders.concat(orders);
        totalPages = pageInfo.numero_paginas || 1;
        
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
          // Pequena pausa entre páginas
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.error('❌ Invalid response from Tiny API');
        break;
      }
    }

    console.log(`\n✅ Pagination test completed!`);
    console.log(`📦 Total orders fetched: ${allOrders.length}`);
    console.log(`📄 Total pages processed: ${currentPage}`);
    console.log(`📊 Expected total pages: ${totalPages}`);

    // Verificar se há pedidos duplicados
    const orderIds = allOrders.map(order => order.pedido.id);
    const uniqueIds = new Set(orderIds);
    
    if (orderIds.length !== uniqueIds.size) {
      console.log(`⚠️  Warning: Found ${orderIds.length - uniqueIds.size} duplicate orders`);
    } else {
      console.log(`✅ No duplicate orders found`);
    }

    // Mostrar estatísticas por status
    const statusCounts = {};
    allOrders.forEach(order => {
      const status = order.pedido.situacao;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    console.log(`\n📊 Orders by status:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    // Mostrar estatísticas por vendedor
    const vendedorCounts = {};
    allOrders.forEach(order => {
      const vendedor = order.pedido.nome_vendedor || 'Não informado';
      vendedorCounts[vendedor] = (vendedorCounts[vendedor] || 0) + 1;
    });

    console.log(`\n👥 Orders by vendedor:`);
    Object.entries(vendedorCounts).forEach(([vendedor, count]) => {
      console.log(`   ${vendedor}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error testing pagination:', error.message);
  }
}

testPagination();
