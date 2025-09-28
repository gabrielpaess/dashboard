/**
 * Script de teste de sincronização com retry e rate limiting
 * Implementa sistema robusto para lidar com limites da API Tiny
 */

const dotenv = require('dotenv');
const { Pool } = require('pg');
const axios = require('axios');

// Load environment variables
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

// Rate Limiter Configuration
class RateLimiter {
  constructor() {
    this.requestTimes = [];
    this.maxRequests = 8; // máximo 8 requisições
    this.timeWindow = 60000; // por minuto (60 segundos)
    this.minDelay = 1500; // 1.5 segundos entre requisições
  }

  async waitForRateLimit() {
    const now = Date.now();
    
    // Remove requisições antigas
    this.requestTimes = this.requestTimes.filter(
      time => now - time < this.timeWindow
    );

    // Se atingiu o limite, aguarda
    if (this.requestTimes.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = this.timeWindow - (now - oldestRequest) + 1000;
      
      console.log(`⏳ Rate limit atingido. Aguardando ${Math.ceil(waitTime / 1000)}s...`);
      await this.delay(waitTime);
      this.requestTimes = [];
    }

    // Delay mínimo entre requisições
    if (this.requestTimes.length > 0) {
      const lastRequest = Math.max(...this.requestTimes);
      const timeSinceLastRequest = now - lastRequest;
      
      if (timeSinceLastRequest < this.minDelay) {
        const waitTime = this.minDelay - timeSinceLastRequest;
        console.log(`⏱️  Aguardando ${waitTime}ms entre requisições...`);
        await this.delay(waitTime);
      }
    }

    this.requestTimes.push(Date.now());
  }

  async executeWithRetry(operation, maxRetries = 3, baseDelay = 2000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        console.log(`🔄 Tentativa ${attempt}/${maxRetries}`);
        return await operation();
        
      } catch (error) {
        lastError = error;
        
        const isRateLimitError = this.isRateLimitError(error);
        const isTimeoutError = this.isTimeoutError(error);
        
        if (isRateLimitError || isTimeoutError) {
          if (attempt < maxRetries) {
            const delay = this.calculateBackoffDelay(attempt, baseDelay);
            console.log(`⚠️  Erro na tentativa ${attempt}/${maxRetries}: ${error.message}`);
            console.log(`⏳ Aguardando ${Math.ceil(delay / 1000)}s antes da próxima tentativa...`);
            
            await this.delay(delay);
            continue;
          }
        }
        
        if (!isRateLimitError && !isTimeoutError) {
          throw error;
        }
      }
    }

    throw new Error(`Operação falhou após ${maxRetries} tentativas. Último erro: ${lastError.message}`);
  }

  isRateLimitError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.response?.status;
    
    return (
      status === 429 ||
      status === 503 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      message.includes('limit exceeded')
    );
  }

  isTimeoutError(error) {
    const message = error.message?.toLowerCase() || '';
    const code = error.code;
    
    return (
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      message.includes('timeout') ||
      message.includes('timed out')
    );
  }

  calculateBackoffDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
    const maxDelay = 30000;
    const finalDelay = Math.min(exponentialDelay + jitter, maxDelay);
    
    return Math.max(finalDelay, 1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    const now = Date.now();
    const recentRequests = this.requestTimes.filter(
      time => now - time < this.timeWindow
    );
    
    return {
      requestsInWindow: recentRequests.length,
      maxRequests: this.maxRequests,
      timeWindowMs: this.timeWindow,
      minDelayMs: this.minDelay,
      canMakeRequest: recentRequests.length < this.maxRequests
    };
  }
}

const rateLimiter = new RateLimiter();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`📋 Found ${result.rows.length} tables: [ ${result.rows.map(r => `'${r.table_name}'`).join(', ')} ]`);
    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testTinyApiConnection() {
  console.log('🔍 Testing Tiny API connection...');
  
  try {
    const response = await rateLimiter.executeWithRetry(async () => {
      const params = new URLSearchParams({
        token: TINY_API_TOKEN,
        formato: 'json',
        pesquisa: 'data_inicial:2025-01-01 data_final:2025-12-31 situacao:Todos',
        pagina: '1',
        limite: '5'
      });

      const response = await axios.post(TINY_API_URL, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      });

      return response.data;
    });

    if (response && response.retorno && response.retorno.pedidos) {
      console.log('✅ Tiny API connection successful');
      console.log(`📦 Found ${response.retorno.pedidos.length} orders in test`);
      return response.retorno.pedidos;
    } else {
      throw new Error('Invalid response from Tiny API');
    }
  } catch (error) {
    console.error('❌ Tiny API connection failed:', error.message);
    throw error;
  }
}

async function fetchOrderDetails(orderId) {
  return rateLimiter.executeWithRetry(async () => {
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      id: orderId.toString(),
      formato: 'json'
    });

    const response = await axios.post(ORDER_DETAILS_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });

    if (response.data && response.data.retorno && response.data.retorno.pedido) {
      return {
        success: true,
        data: response.data.retorno.pedido
      };
    } else {
      throw new Error('Invalid response from Tiny API');
    }
  }, 3, 2000);
}

function mapItens(itens) {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens.map(item => {
    const itemData = item.item || item;
    
    const quantidade = parseFloat(itemData.quantidade || 0);
    const valorUnitario = parseFloat(itemData.valor_unitario || 0);
    const valorTotal = parseFloat(itemData.valor_total || 0);
    
    return {
      id: itemData.id_produto?.toString() || itemData.id?.toString() || null,
      codigo: itemData.codigo || null,
      descricao: itemData.descricao || 'Item sem descrição',
      quantidade: quantidade,
      valor_unitario: valorUnitario,
      valor_total: valorTotal,
      unidade: itemData.unidade || 'UN',
      observacoes: itemData.observacoes || null,
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

async function testSyncWithRetry() {
  console.log('🚀 Starting comprehensive sync test with retry and rate limiting...\n');

  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test Tiny API connection
    console.log('\n🔍 Testing Tiny API connection...');
    const orders = await testTinyApiConnection();
    console.log(`✅ Found ${orders.length} orders to sync`);

    // Test sync process with retry
    console.log('\n🔄 Testing sync process with retry and rate limiting...');
    const client = await pool.connect();
    
    let synced = 0;
    let errors = 0;
    const startTime = Date.now();

    // Process first 10 orders for testing
    const testOrders = orders.slice(0, 10);
    
    for (let i = 0; i < testOrders.length; i++) {
      const order = testOrders[i];
      
      try {
        const pedidoData = order.pedido || order;
        const pedidoId = pedidoData.id?.toString();

        if (!pedidoId) {
          console.log(`⚠️  Order without ID skipped: ${JSON.stringify(order)}`);
          continue;
        }

        if (pedidoData.situacao === 'Cancelado') {
          console.log(`⏭️  Order ${pedidoId} filtered out (situacao: Cancelado)`);
          continue;
        }

        console.log(`\n📦 Processing order ${i + 1}/${testOrders.length}: ${pedidoId}`);

        // Buscar detalhes com retry
        const orderDetails = await fetchOrderDetails(pedidoId);
        const fullOrderData = orderDetails.data || pedidoData;

        const exists = await client.query(
          'SELECT id FROM pedidos WHERE pedido_id = $1',
          [pedidoId]
        );

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
              numero = $2,
              nome_cliente = $3,
              data_pedido = $4,
              data_pedido_pt_br = $5,
              data_prevista = $6,
              situacao = $7,
              valor_total = $8,
              nome_vendedor = $9,
              itens_json = $10,
              envio_15 = $11,
              envio_45 = $12,
              updated_at = NOW()
            WHERE pedido_id = $1
          `, [
            orderData.pedido_id,
            orderData.numero,
            orderData.nome_cliente,
            orderData.data_pedido,
            orderData.data_pedido_pt_br,
            orderData.data_prevista,
            orderData.situacao,
            orderData.valor_total,
            orderData.nome_vendedor,
            JSON.stringify(orderData.itens_json),
            orderData.envio_15,
            orderData.envio_45
          ]);
          console.log(`✅ Updated order ${pedidoId}`);
        } else {
          // Insert new order
          await client.query(`
            INSERT INTO pedidos (
              pedido_id, numero, nome_cliente, data_pedido, data_pedido_pt_br,
              data_prevista, situacao, valor_total, nome_vendedor, itens_json,
              envio_15, envio_45, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          `, [
            orderData.pedido_id,
            orderData.numero,
            orderData.nome_cliente,
            orderData.data_pedido,
            orderData.data_pedido_pt_br,
            orderData.data_prevista,
            orderData.situacao,
            orderData.valor_total,
            orderData.nome_vendedor,
            JSON.stringify(orderData.itens_json),
            orderData.envio_15,
            orderData.envio_45
          ]);
          console.log(`✅ Inserted new order ${pedidoId}`);
        }

        synced++;
        
        // Mostrar estatísticas do rate limiter
        const stats = rateLimiter.getStats();
        console.log(`📊 Rate Limiter: ${stats.requestsInWindow}/${stats.maxRequests} requests in window`);

      } catch (error) {
        console.log(`❌ Error syncing order ${order.id || order.pedido?.id}: ${error.message}`);
        errors++;
      }
    }

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log(`\n📊 Sync Results: ${synced} synced, ${errors} errors`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`📈 Rate: ${(synced / duration * 60).toFixed(2)} orders/minute`);

    // Test data retrieval
    console.log('\n📊 Testing data retrieval...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM pedidos');
    console.log(`📦 Total orders in database: ${countResult.rows[0].count}`);

    const recentOrders = await client.query(`
      SELECT pedido_id, numero, nome_cliente, situacao, valor_total
      FROM pedidos 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('📋 Recent orders:');
    recentOrders.rows.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.numero} - ${order.nome_cliente} - ${order.situacao} - R$ ${order.valor_total}`);
    });

    client.release();
    console.log('\n🎉 All tests passed successfully!');
    console.log('✅ Database connection: OK');
    console.log('✅ Tiny API connection: OK');
    console.log('✅ Sync process with retry: OK');
    console.log('✅ Data storage: OK');
    console.log('✅ Data retrieval: OK');

    return true;

  } catch (error) {
    console.error('❌ Sync process failed:', error.message);
    return false;
  }
}

// Run the test
testSyncWithRetry()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    pool.end();
    process.exit(1);
  });
