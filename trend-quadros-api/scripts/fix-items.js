/**
 * Script para corrigir itens_json vazios nos pedidos
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
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchOrderDetails(orderId) {
  const params = new URLSearchParams({
    token: TINY_API_TOKEN,
    id: orderId,
    formato: 'json'
  });

  try {
    console.log(`🔍 Buscando detalhes do pedido ${orderId}...`);
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

async function fixEmptyItems() {
  console.log('🔧 Iniciando correção de itens_json vazios...\n');

  try {
    const client = await pool.connect();
    console.log('✅ Conectado ao banco de dados');

    // Buscar pedidos com itens_json vazios ou nulos
    const result = await client.query(`
      SELECT pedido_id, numero, nome_cliente, situacao, itens_json
      FROM pedidos 
      WHERE itens_json IS NULL 
         OR itens_json = '[]'::jsonb
         OR jsonb_array_length(itens_json) = 0
      ORDER BY created_at DESC
    `);

    console.log(`📦 Encontrados ${result.rows.length} pedidos com itens vazios\n`);

    if (result.rows.length === 0) {
      console.log('✅ Todos os pedidos já possuem itens!');
      client.release();
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const pedido of result.rows) {
      try {
        console.log(`\n🔄 Processando pedido ${pedido.numero} - ${pedido.nome_cliente}`);
        
        // Buscar detalhes do pedido na API Tiny
        const orderDetails = await fetchOrderDetails(pedido.pedido_id);
        
        if (!orderDetails.success) {
          console.log(`❌ Falha ao buscar detalhes do pedido ${pedido.numero}`);
          errorCount++;
          continue;
        }

        const fullOrderData = orderDetails.data;
        const itens = mapItens(fullOrderData.itens || []);

        if (itens.length === 0) {
          console.log(`⚠️  Pedido ${pedido.numero} não possui itens na API Tiny`);
          continue;
        }

        // Atualizar o pedido com os itens
        await client.query(
          `UPDATE pedidos 
           SET itens_json = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE pedido_id = $2`,
          [JSON.stringify(itens), pedido.pedido_id]
        );

        console.log(`✅ Pedido ${pedido.numero} atualizado com ${itens.length} itens`);
        fixedCount++;

        // Delay para não sobrecarregar a API
        await delay(1000);

      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${pedido.numero}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Resultado da correção:`);
    console.log(`✅ Pedidos corrigidos: ${fixedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📦 Total processado: ${result.rows.length}`);

    client.release();

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

async function checkItemsStatus() {
  console.log('\n🔍 Verificando status dos itens...\n');

  try {
    const client = await pool.connect();

    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN itens_json IS NOT NULL AND jsonb_array_length(itens_json) > 0 THEN 1 END) as pedidos_com_itens,
        COUNT(CASE WHEN itens_json IS NULL OR itens_json = '[]'::jsonb OR jsonb_array_length(itens_json) = 0 THEN 1 END) as pedidos_sem_itens
      FROM pedidos
    `);

    const data = stats.rows[0];
    console.log('📊 Estatísticas:');
    console.log(`   Total de pedidos: ${data.total_pedidos}`);
    console.log(`   Com itens: ${data.pedidos_com_itens}`);
    console.log(`   Sem itens: ${data.pedidos_sem_itens}`);
    console.log(`   Percentual com itens: ${((data.pedidos_com_itens / data.total_pedidos) * 100).toFixed(1)}%`);

    client.release();

  } catch (error) {
    console.error('❌ Erro ao verificar status:', error.message);
  } finally {
    await pool.end();
  }
}

async function main() {
  console.log('🚀 Script de correção de itens_json\n');
  
  await checkItemsStatus();
  await fixEmptyItems();
  await checkItemsStatus();
  
  console.log('\n✅ Script finalizado!');
}

main();
