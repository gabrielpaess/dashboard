/**
 * Script para executar sincronização inicial completa com paginação
 * Este script é executado na inicialização da API para garantir que todos os pedidos estejam sincronizados
 */

const dotenv = require('dotenv');
const path = require('path');
const { Pool } = require('pg');
const axios = require('axios');

// Load environment variables - garantir que encontre o arquivo .env
const envPath = path.join(process.cwd(), '.env');
console.log(`🔍 Carregando variáveis de ambiente de: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Erro ao carregar .env:', result.error);
  process.exit(1);
} else {
  console.log('✅ Variáveis de ambiente carregadas com sucesso');
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
});

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllOrdersWithPagination() {
  const allOrders = [];
  let currentPage = 1;
  let totalPages = 1;
  let hasMorePages = true;

  console.log('🔄 Buscando todos os pedidos com paginação...');

  while (hasMorePages) {
    console.log(`📄 Buscando página ${currentPage}...`);
    
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      formato: 'json',
      dataInicial: '01/01/2024',
      dataFinal: '31/12/2025',
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
        console.log(`   📦 Página ${currentPage}: ${orders.length} pedidos (Total: ${allOrders.length})`);
        
        if (currentPage >= totalPages) {
          hasMorePages = false;
        } else {
          currentPage++;
          await delay(1000);
        }
      } else {
        console.log(`   ⚠️  Nenhum pedido encontrado na página ${currentPage}`);
        hasMorePages = false;
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar página ${currentPage}:`, error.message);
      hasMorePages = false;
    }
  }

  console.log(`✅ Busca completa: ${allOrders.length} pedidos de ${currentPage} páginas`);
  return allOrders;
}

async function fetchOrderDetails(orderId) {
  const params = new URLSearchParams({
    token: TINY_API_TOKEN,
    id: orderId,
    formato: 'json'
  });

  try {
    const response = await axios.post(ORDER_DETAILS_URL, params.toString(), {
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
      return response.data.retorno.pedido;
    } else {
      throw new Error('Resposta inválida da API Tiny');
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do pedido ${orderId}:`, error.message);
    throw error;
  }
}

function mapItens(itens) {
  if (!itens || !Array.isArray(itens)) return [];
  
  return itens.map(item => ({
    id: item.item.id || null,
    codigo: item.item.codigo || '',
    descricao: item.item.descricao || '',
    quantidade: parseFloat(item.item.quantidade || 0),
    valor_unitario: parseFloat(item.item.valor_unitario || 0),
    valor_total: parseFloat(item.item.valor_total || 0),
    unidade: item.item.unidade || '',
    observacoes: item.item.observacoes || '',
    tipo: item.item.tipo || 'P',
    situacao: item.item.situacao || 'Ativo'
  }));
}

function extractValorTotal(pedidoData) {
  if (pedidoData.valor_total) {
    return parseFloat(pedidoData.valor_total);
  }
  
  if (pedidoData.itens && Array.isArray(pedidoData.itens)) {
    return pedidoData.itens.reduce((total, item) => {
      return total + (parseFloat(item.item?.valor_total || 0));
    }, 0);
  }
  
  return 0;
}

async function executeInitialSync() {
  console.log('🚀 Executando sincronização inicial completa...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se já existem pedidos no banco
    const existingCount = await client.query('SELECT COUNT(*) as count FROM pedidos');
    const existingOrders = parseInt(existingCount.rows[0].count);
    
    if (existingOrders > 0) {
      console.log(`📦 Encontrados ${existingOrders} pedidos existentes no banco`);
      console.log('🔄 Executando sincronização incremental...\n');
    } else {
      console.log('📦 Banco vazio, executando sincronização completa...\n');
    }

    // Buscar todos os pedidos da API Tiny com paginação
    const orders = await fetchAllOrdersWithPagination();
    console.log(`📦 Encontrados ${orders.length} pedidos na API Tiny\n`);

    if (orders.length === 0) {
      console.log('⚠️  Nenhum pedido encontrado na API Tiny');
      client.release();
      return;
    }

    let syncedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Processar pedidos em lotes
    const batchSize = 5;
    for (let i = 0; i < orders.length; i += batchSize) {
      const batch = orders.slice(i, i + batchSize);
      console.log(`📦 Processando lote ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(orders.length / batchSize)} (${batch.length} pedidos)`);

      for (const order of batch) {
        try {
          const pedidoData = order.pedido || order;
          const pedidoId = pedidoData.id?.toString();

          if (!pedidoId) {
            console.log(`⚠️  Pedido sem ID, pulando...`);
            skippedCount++;
            continue;
          }

          // Pular pedidos cancelados
          if (pedidoData.situacao === 'Cancelado') {
            console.log(`⏭️  Pedido ${pedidoId} cancelado, pulando...`);
            skippedCount++;
            continue;
          }

          console.log(`🔄 Processando pedido ${pedidoId} - ${pedidoData.nome || 'N/A'}`);

          // Buscar detalhes completos do pedido
          const orderDetails = await fetchOrderDetails(pedidoId);
          
          // Mapear itens
          const itens = mapItens(orderDetails.itens || []);
          
          // Verificar se pedido já existe
          const existingOrder = await client.query(
            'SELECT id FROM pedidos WHERE pedido_id = $1',
            [pedidoId]
          );
          
          const orderData = {
            pedido_id: pedidoId,
            numero: pedidoData.numero || '',
            nome_cliente: pedidoData.nome || '',
            data_pedido: pedidoData.data_pedido ? new Date(pedidoData.data_pedido.split('/').reverse().join('-')) : null,
            data_pedido_pt_br: pedidoData.data_pedido || '',
            data_prevista: pedidoData.data_prevista || '',
            situacao: pedidoData.situacao || '',
            valor_total: extractValorTotal(orderDetails),
            nome_vendedor: pedidoData.nome_vendedor || '',
            itens_json: JSON.stringify(itens),
            envio_15: false,
            envio_45: false
          };
          
          if (existingOrder.rows.length > 0) {
            // Atualizar pedido existente
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
              orderData.itens_json
            ]);
            console.log(`✅ Pedido ${pedidoId} atualizado com ${itens.length} itens`);
          } else {
            // Inserir novo pedido
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
              orderData.itens_json,
              orderData.envio_15,
              orderData.envio_45
            ]);
            console.log(`✅ Pedido ${pedidoId} inserido com ${itens.length} itens`);
          }
          
          syncedCount++;
          
        } catch (error) {
          console.error(`❌ Erro ao processar pedido ${order.pedido?.id || 'N/A'}:`, error.message);
          errorCount++;
        }
      }
      
      // Pausa entre lotes
      if (i + batchSize < orders.length) {
        console.log(`⏳ Aguardando 3 segundos antes do próximo lote...`);
        await delay(3000);
      }
    }

    console.log(`\n📊 Resultado da sincronização inicial:`);
    console.log(`✅ Pedidos sincronizados: ${syncedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log(`📦 Total processado: ${syncedCount + errorCount + skippedCount}`);

    // Verificar quantos pedidos têm itens
    const itemsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN itens_json != '[]' AND itens_json IS NOT NULL THEN 1 END) as with_items
      FROM pedidos
    `);
    
    const totalPedidos = parseInt(itemsResult.rows[0].total);
    const withItems = parseInt(itemsResult.rows[0].with_items);
    const percentage = totalPedidos > 0 ? ((withItems / totalPedidos) * 100).toFixed(1) : 0;
    
    console.log(`\n📈 Status final:`);
    console.log(`   Total de pedidos: ${totalPedidos}`);
    console.log(`   Com itens: ${withItems}`);
    console.log(`   Percentual com itens: ${percentage}%`);

    client.release();
    console.log('\n✅ Sincronização inicial finalizada!');

  } catch (error) {
    console.error('❌ Erro na sincronização inicial:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  executeInitialSync()
    .then(() => {
      console.log('🎉 Sincronização inicial concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro na sincronização inicial:', error.message);
      process.exit(1);
    });
}

module.exports = { executeInitialSync };
