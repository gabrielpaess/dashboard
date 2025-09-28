const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

async function testSyncPagination() {
  console.log('🔍 Testing Sync with Pagination...');
  
  const client = new Client(DB_CONFIG);
  
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    // 1. Buscar todos os pedidos da API Tiny com paginação
    console.log('\n📡 Fetching all orders from Tiny API with pagination...');
    const allOrders = await fetchAllOrdersWithPagination();
    console.log(`📦 Total orders from Tiny API: ${allOrders.length}`);
    
    // 2. Verificar quantos pedidos estão no banco
    console.log('\n🗄️  Checking orders in database...');
    const dbResult = await client.query('SELECT COUNT(*) as total FROM pedidos');
    const dbCount = parseInt(dbResult.rows[0].total);
    console.log(`📦 Total orders in database: ${dbCount}`);
    
    // 3. Comparar
    console.log('\n📊 Comparison:');
    console.log(`   Tiny API: ${allOrders.length} orders`);
    console.log(`   Database: ${dbCount} orders`);
    console.log(`   Difference: ${allOrders.length - dbCount} orders`);
    
    if (allOrders.length === dbCount) {
      console.log('✅ Perfect sync! All orders are synchronized.');
    } else if (allOrders.length > dbCount) {
      console.log('⚠️  Database is missing some orders. Sync needed.');
    } else {
      console.log('⚠️  Database has more orders than Tiny API. This might indicate old data.');
    }
    
    // 4. Mostrar estatísticas por status
    console.log('\n📊 Orders by status (Tiny API):');
    const statusCounts = {};
    allOrders.forEach(order => {
      const status = order.pedido.situacao;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // 5. Mostrar estatísticas por vendedor
    console.log('\n👥 Orders by vendedor (Tiny API):');
    const vendedorCounts = {};
    allOrders.forEach(order => {
      const vendedor = order.pedido.nome_vendedor || 'Não informado';
      vendedorCounts[vendedor] = (vendedorCounts[vendedor] || 0) + 1;
    });
    
    Object.entries(vendedorCounts).forEach(([vendedor, count]) => {
      console.log(`   ${vendedor}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

async function fetchAllOrdersWithPagination() {
  const allOrders = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    console.log(`📄 Fetching page ${currentPage}...`);
    
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
        throw new Error(`Tiny API Error: ${errorMessage}`);
      }

      const orders = response.data.retorno.pedidos || [];
      allOrders.push(...orders);
      
      totalPages = response.data.retorno.numero_paginas || 1;
      console.log(`   📦 Page ${currentPage}: ${orders.length} orders (Total: ${allOrders.length})`);
      
      if (currentPage >= totalPages) {
        hasMorePages = false;
      } else {
        currentPage++;
        // Pequena pausa entre páginas
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log(`   ⚠️  No orders found on page ${currentPage}`);
      hasMorePages = false;
    }
  }

  return allOrders;
}

testSyncPagination();
