/**
 * Script para sincronizar todos os pedidos com itens_json corretos
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

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

async function fetchOrdersFromTiny(options = {}) {
  const params = new URLSearchParams({
    token: TINY_API_TOKEN,
    formato: 'json',
    dataInicial: '01/01/2024',
    dataFinal: '31/12/2025',
    registrosPorPagina: '1000',
    ...options
  });

  try {
    console.log('🔍 Buscando pedidos da API Tiny...');
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
      return response.data.retorno.pedidos || [];
    } else {
      throw new Error('Resposta inválida da API Tiny');
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pedidos:', error.message);
    throw error;
  }
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
      timeout: 10000
    });

    if (response.data && response.data.retorno && response.data.retorno.pedido) {
      return {
        success: true,
        data: response.data.retorno.pedido
      };
    } else {
      throw new Error('Resposta inválida da API Tiny');
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes do pedido ${orderId}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

function mapItens(itens) {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens.map(item => {
    const itemData = item.item || item;

    return {
      id: itemData.id_produto?.toString() || itemData.id?.toString() || null,
      codigo: itemData.codigo || null,
      descricao: itemData.descricao || 'Item sem descrição',
      quantidade: parseFloat(itemData.quantidade || 0),
      valor_unitario: parseFloat(itemData.valor_unitario || 0),
      valor_total: parseFloat(itemData.valor_total || 0),
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
  
  // Se já é uma data ISO
  if (dateString.includes('T') || dateString.includes('Z')) {
    return new Date(dateString).toISOString();
  }
  
  // Formato DD/MM/YYYY
  const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (parts) {
    const [, day, month, year] = parts;
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString();
  }
  
  return null;
}

function formatDateToPTBR(dateString) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return null;
  }
}

function extractValorTotal(pedidoData) {
  const possibleFields = [
    pedidoData.valor,
    pedidoData.total_pedido,
    pedidoData.valor_total,
    pedidoData.totalProdutos
  ];

  for (const field of possibleFields) {
    if (field !== undefined && field !== null) {
      const parsedValue = parseFloat(field);
      if (!isNaN(parsedValue)) {
        return parsedValue;
      }
    }
  }
  return 0;
}

async function syncAllOrders() {
  console.log('🚀 Iniciando sincronização completa com itens...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Buscar todos os pedidos da API Tiny
    const orders = await fetchOrdersFromTiny();
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
      console.log(`\n📦 Processando lote ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(orders.length / batchSize)} (${batch.length} pedidos)`);

      for (const order of batch) {
        try {
          const pedidoData = order.pedido || order;
          const pedidoId = pedidoData.id?.toString();

          if (!pedidoId) {
            console.log(`⚠️  Pedido sem ID, pulando...`);
            skippedCount++;
            continue;
          }

          if (pedidoData.situacao === 'Cancelado') {
            console.log(`⏭️  Pedido ${pedidoId} cancelado, pulando...`);
            skippedCount++;
            continue;
          }

          console.log(`🔄 Processando pedido ${pedidoId} - ${pedidoData.nome || 'Sem nome'}`);

          // Buscar detalhes completos do pedido (incluindo itens)
          const orderDetails = await fetchOrderDetails(pedidoId);
          
          if (!orderDetails.success) {
            console.log(`❌ Falha ao buscar detalhes do pedido ${pedidoId}`);
            errorCount++;
            continue;
          }

          const fullOrderData = orderDetails.data;
          const itens = mapItens(fullOrderData.itens || []);

          // Formatar dados do pedido
          const orderData = {
            pedido_id: pedidoId,
            numero: fullOrderData.numero,
            nome_cliente: fullOrderData.nome || fullOrderData.cliente?.nome || 'Cliente não informado',
            data_pedido: formatDateToISO(fullOrderData.data_pedido),
            data_pedido_pt_br: formatDateToPTBR(fullOrderData.data_pedido),
            data_prevista: fullOrderData.data_prevista || null,
            situacao: fullOrderData.situacao || 'Não informado',
            valor_total: extractValorTotal(fullOrderData),
            nome_vendedor: fullOrderData.nome_vendedor || 'Não informado',
            itens_json: itens,
            envio_15: false,
            envio_45: false
          };

          // Verificar se o pedido já existe
          const existingPedido = await client.query(
            'SELECT id FROM pedidos WHERE pedido_id = $1',
            [pedidoId]
          );

          if (existingPedido.rows.length > 0) {
            // Atualizar pedido existente
            await client.query(
              `UPDATE pedidos SET 
                numero = $1, nome_cliente = $2, data_pedido = $3, 
                data_pedido_pt_br = $4, data_prevista = $5, situacao = $6, 
                valor_total = $7, nome_vendedor = $8, itens_json = $9, 
                envio_15 = $10, envio_45 = $11, updated_at = CURRENT_TIMESTAMP 
               WHERE pedido_id = $12`,
              [
                orderData.numero, orderData.nome_cliente, orderData.data_pedido,
                orderData.data_pedido_pt_br, orderData.data_prevista, orderData.situacao,
                orderData.valor_total, orderData.nome_vendedor, JSON.stringify(orderData.itens_json),
                orderData.envio_15, orderData.envio_45, orderData.pedido_id
              ]
            );
            console.log(`✅ Pedido ${pedidoId} atualizado com ${itens.length} itens`);
          } else {
            // Inserir novo pedido
            await client.query(
              `INSERT INTO pedidos (
                pedido_id, numero, nome_cliente, data_pedido, data_pedido_pt_br, 
                data_prevista, situacao, valor_total, nome_vendedor, itens_json, 
                envio_15, envio_45
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [
                orderData.pedido_id, orderData.numero, orderData.nome_cliente,
                orderData.data_pedido, orderData.data_pedido_pt_br, orderData.data_prevista,
                orderData.situacao, orderData.valor_total, orderData.nome_vendedor,
                JSON.stringify(orderData.itens_json), orderData.envio_15, orderData.envio_45
              ]
            );
            console.log(`✅ Pedido ${pedidoId} inserido com ${itens.length} itens`);
          }

          syncedCount++;

          // Delay para não sobrecarregar a API
          await delay(2000);

        } catch (error) {
          console.error(`❌ Erro ao processar pedido ${order.pedido?.id || order.id}:`, error.message);
          errorCount++;
        }
      }

      // Delay entre lotes
      if (i + batchSize < orders.length) {
        console.log('⏳ Aguardando 5 segundos antes do próximo lote...');
        await delay(5000);
      }
    }

    console.log(`\n📊 Resultado da sincronização:`);
    console.log(`✅ Pedidos sincronizados: ${syncedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`⏭️  Pulados: ${skippedCount}`);
    console.log(`📦 Total processado: ${orders.length}`);

    // Verificar status final
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN itens_json IS NOT NULL AND jsonb_array_length(itens_json) > 0 THEN 1 END) as pedidos_com_itens
      FROM pedidos
    `);

    const finalStats = stats.rows[0];
    console.log(`\n📈 Status final:`);
    console.log(`   Total de pedidos: ${finalStats.total_pedidos}`);
    console.log(`   Com itens: ${finalStats.pedidos_com_itens}`);
    console.log(`   Percentual com itens: ${((finalStats.pedidos_com_itens / finalStats.total_pedidos) * 100).toFixed(1)}%`);

    client.release();

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Script de sincronização completa com itens\n');
  await syncAllOrders();
  console.log('\n✅ Sincronização finalizada!');
}

main();
