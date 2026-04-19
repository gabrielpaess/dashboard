const { Pool } = require('pg');
const axios = require('axios');
const { getRollingTwoMonthTinyDateRange } = require('./tiny-date-range');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
});

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';

async function checkMissingOrders() {
  console.log('🔍 Checking for missing orders...');
  
  const client = await pool.connect();
  
  try {
    // 1. Buscar todos os pedidos da API Tiny
    const allOrders = await fetchAllOrdersWithPagination();
    console.log(`📦 Total orders from Tiny API: ${allOrders.length}`);
    
    // 2. Buscar todos os pedidos do banco
    const dbResult = await client.query('SELECT pedido_id FROM pedidos ORDER BY pedido_id');
    const dbOrderIds = dbResult.rows.map(row => row.pedido_id);
    console.log(`📦 Total orders in database: ${dbOrderIds.length}`);
    
    // 3. Encontrar pedidos faltando
    const apiOrderIds = allOrders.map(order => order.pedido.id.toString());
    const missingOrders = apiOrderIds.filter(id => !dbOrderIds.includes(id));
    
    console.log(`\n📊 Missing orders: ${missingOrders.length}`);
    
    if (missingOrders.length > 0) {
      console.log('\n🔍 Missing order details:');
      for (const missingId of missingOrders) {
        const order = allOrders.find(o => o.pedido.id.toString() === missingId);
        if (order) {
          console.log(`   ID: ${missingId}`);
          console.log(`   Número: ${order.pedido.numero}`);
          console.log(`   Cliente: ${order.pedido.nome}`);
          console.log(`   Status: ${order.pedido.situacao}`);
          console.log(`   Vendedor: ${order.pedido.nome_vendedor || 'N/A'}`);
          console.log(`   Valor: R$ ${order.pedido.valor || 0}`);
          console.log('   ---');
        }
      }
    }
    
    // 4. Verificar pedidos extras no banco
    const extraOrders = dbOrderIds.filter(id => !apiOrderIds.includes(id));
    console.log(`\n📊 Extra orders in database: ${extraOrders.length}`);
    
    if (extraOrders.length > 0) {
      console.log('\n🔍 Extra order IDs:');
      extraOrders.forEach(id => console.log(`   ${id}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

async function fetchAllOrdersWithPagination() {
  const allOrders = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const range = getRollingTwoMonthTinyDateRange();
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      formato: 'json',
      dataInicial: range.dataInicial,
      dataFinal: range.dataFinal,
      registrosPorPagina: '100',
      pagina: currentPage.toString()
    });

    try {
      const response = await axios.post(TINY_API_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      });

      if (response.data && response.data.retorno) {
        if (response.data.retorno.status === 'Erro') {
          const errorMessage = response.data.retorno.erros?.[0]?.erro || 'Erro desconhecido da API Tiny';
          throw new Error(`Tiny API error: ${errorMessage}`);
        }

        const orders = response.data.retorno.pedidos || [];
        allOrders.push(...orders);
        
        totalPages = response.data.retorno.numero_paginas || 1;
        
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        hasMorePages = false;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${currentPage}:`, error.message);
      hasMorePages = false;
    }
  }

  return allOrders;
}

checkMissingOrders();
