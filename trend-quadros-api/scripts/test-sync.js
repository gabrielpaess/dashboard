#!/usr/bin/env node

/**
 * Test Sync Process
 * Tests the complete synchronization process with Tiny API
 */

const dotenv = require('dotenv');
const { Pool } = require('pg');
const axios = require('axios');

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test if tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('pedidos', 'usuarios')
    `);
    
    console.log(`📋 Found ${result.rows.length} tables:`, result.rows.map(r => r.table_name));
    
    if (result.rows.length === 0) {
      console.log('⚠️  No tables found. Please run migrations first.');
      return false;
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testTinyAPI() {
  console.log('🔍 Testing Tiny API connection...');
  
  if (!TINY_API_TOKEN) {
    console.error('❌ TINY_API_TOKEN not found');
    return false;
  }

  try {
    const url = new URL(TINY_API_URL);
    url.searchParams.append('token', TINY_API_TOKEN);
    url.searchParams.append('formato', 'json');
    url.searchParams.append('registrosPorPagina', '5');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.retorno && data.retorno.status === 'Erro') {
      const errorMessage = data.retorno.erros?.[0]?.erro || 'Unknown error';
      throw new Error(`Tiny API Error: ${errorMessage}`);
    }

    console.log('✅ Tiny API connection successful');
    return data.retorno?.pedidos || [];
  } catch (error) {
    console.error('❌ Tiny API connection failed:', error.message);
    return false;
  }
}

async function testSyncProcess(orders) {
  console.log('🔄 Testing sync process...');
  
  if (!orders || orders.length === 0) {
    console.log('📭 No orders to sync');
    return true;
  }

  try {
    const client = await pool.connect();
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const order of orders) {
      try {
        const pedidoData = order.pedido || order;
        const pedidoId = pedidoData.id?.toString();
        
        if (!pedidoId) {
          console.log('⚠️  Skipping order without ID');
          continue;
        }

        // Check if order already exists
        const exists = await client.query(
          'SELECT id FROM pedidos WHERE pedido_id = $1',
          [pedidoId]
        );

        // Buscar detalhes completos do pedido (incluindo itens)
        const orderDetails = await fetchOrderDetails(pedidoId);
        const fullOrderData = orderDetails.data || pedidoData;

        const orderData = {
          pedido_id: pedidoId,
          numero: fullOrderData.numero || null,
          nome_cliente: fullOrderData.nome || fullOrderData.cliente?.nome || 'Cliente não informado',
          data_pedido: formatDateToISO(fullOrderData.data_pedido),
          data_pedido_pt_br: formatDateToPTBR(fullOrderData.data_pedido),
          data_prevista: fullOrderData.data_prevista || null,
          situacao: fullOrderData.situacao || 'Não informado',
          valor_total: extractValorTotal(fullOrderData),
          nome_vendedor: fullOrderData.nome_vendedor || 'Não informado',
          itens_json: mapItens(fullOrderData.itens),
          envio_15: false,
          envio_45: false
        };

        if (exists.rows.length > 0) {
          // Update existing order
          await client.query(`
            UPDATE pedidos SET 
              numero = $2, nome_cliente = $3, data_pedido = $4, 
              data_pedido_pt_br = $5, data_prevista = $6, situacao = $7,
              valor_total = $8, nome_vendedor = $9, itens_json = $10,
              updated_at = CURRENT_TIMESTAMP
            WHERE pedido_id = $1
          `, [
            orderData.pedido_id, orderData.numero, orderData.nome_cliente,
            orderData.data_pedido, orderData.data_pedido_pt_br, orderData.data_prevista,
            orderData.situacao, orderData.valor_total, orderData.nome_vendedor,
            JSON.stringify(orderData.itens_json)
          ]);
          console.log(`🔄 Updated order ${pedidoId}`);
        } else {
          // Insert new order
          await client.query(`
            INSERT INTO pedidos (
              pedido_id, numero, nome_cliente, data_pedido, data_pedido_pt_br,
              data_prevista, situacao, valor_total, nome_vendedor, itens_json,
              envio_15, envio_45
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            orderData.pedido_id, orderData.numero, orderData.nome_cliente,
            orderData.data_pedido, orderData.data_pedido_pt_br, orderData.data_prevista,
            orderData.situacao, orderData.valor_total, orderData.nome_vendedor,
            JSON.stringify(orderData.itens_json), orderData.envio_15, orderData.envio_45
          ]);
          console.log(`➕ Inserted new order ${pedidoId}`);
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`❌ Error syncing order ${order.id || order.pedido?.id}:`, error.message);
        errorCount++;
      }
    }
    
    client.release();
    
    console.log(`📊 Sync Results: ${syncedCount} synced, ${errorCount} errors`);
    return errorCount === 0;
  } catch (error) {
    console.error('❌ Sync process failed:', error.message);
    return false;
  }
}

function mapItens(itens) {
  if (!Array.isArray(itens)) {
    return [];
  }

  // Mapear itens da estrutura aninhada da API Tiny
  return itens.map(item => {
    // A API Tiny pode retornar itens em duas estruturas:
    // 1. item.item (estrutura aninhada)
    // 2. item (estrutura direta)
    const itemData = item.item || item;
    
    return {
      id: itemData.id?.toString() || null,
      codigo: itemData.codigo || null,
      descricao: itemData.descricao || 'Item sem descrição',
      quantidade: parseFloat(itemData.quantidade || 0),
      valor_unitario: parseFloat(itemData.valor_unitario || 0),
      valor_total: parseFloat(itemData.valor_total || 0),
      unidade: itemData.unidade || 'UN',
      observacoes: itemData.observacoes || null,
      // Campos adicionais que podem estar presentes
      produto: itemData.produto || null,
      categoria: itemData.categoria || null,
      peso: parseFloat(itemData.peso || 0),
      altura: parseFloat(itemData.altura || 0),
      largura: parseFloat(itemData.largura || 0),
      comprimento: parseFloat(itemData.comprimento || 0)
    };
  });
}

function formatDateToISO(dateString) {
  if (!dateString) return null;
  
  try {
    if (dateString.includes('-')) {
      return dateString;
    }
    
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

function formatDateToPTBR(dateString) {
  if (!dateString) return null;
  
  try {
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch (error) {
    return null;
  }
}

function extractValorTotal(pedidoData) {
  const possibleFields = [
    pedidoData.valor,
    pedidoData.total_pedido,
    pedidoData.valor_total,
    pedidoData.total,
    pedidoData.valor_pedido
  ];
  
  for (const field of possibleFields) {
    if (field !== undefined && field !== null && field !== '') {
      const parsed = parseFloat(field);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  
  return 0;
}

async function testDataRetrieval() {
  console.log('📊 Testing data retrieval...');
  
  try {
    const client = await pool.connect();
    
    // Get total count
    const countResult = await client.query('SELECT COUNT(*) as total FROM pedidos');
    const totalOrders = countResult.rows[0].total;
    
    // Get recent orders
    const recentResult = await client.query(`
      SELECT pedido_id, numero, nome_cliente, situacao, valor_total, created_at
      FROM pedidos 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📦 Total orders in database: ${totalOrders}`);
    console.log('📋 Recent orders:');
    recentResult.rows.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.numero || order.pedido_id} - ${order.nome_cliente} - ${order.situacao} - R$ ${order.valor_total || 0}`);
    });
    
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Data retrieval failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive sync test...\n');
  
  // Test 1: Database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('💥 Database test failed. Exiting.');
    process.exit(1);
  }
  
  // Test 2: Tiny API connection
  const orders = await testTinyAPI();
  if (orders === false) {
    console.error('💥 Tiny API test failed. Exiting.');
    process.exit(1);
  }
  
  // Test 3: Sync process
  const syncSuccess = await testSyncProcess(orders);
  if (!syncSuccess) {
    console.error('💥 Sync process failed. Exiting.');
    process.exit(1);
  }
  
  // Test 4: Data retrieval
  const retrievalSuccess = await testDataRetrieval();
  if (!retrievalSuccess) {
    console.error('💥 Data retrieval failed. Exiting.');
    process.exit(1);
  }
  
  console.log('\n🎉 All tests passed successfully!');
  console.log('✅ Database connection: OK');
  console.log('✅ Tiny API connection: OK');
  console.log('✅ Sync process: OK');
  console.log('✅ Data storage: OK');
  console.log('✅ Data retrieval: OK');
}

async function fetchOrderDetails(orderId) {
  try {
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      id: orderId.toString(),
      formato: 'json'
    });

    const response = await axios.post(ORDER_DETAILS_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.retorno && response.data.retorno.pedido) {
      return {
        success: true,
        data: response.data.retorno.pedido
      };
    } else {
      throw new Error('Invalid response from Tiny API');
    }
  } catch (error) {
    console.error(`Error fetching order details for ${orderId}:`, error.message);
    return { success: false, data: null };
  }
}

// Run the tests
runTests()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    pool.end();
    process.exit(1);
  });
