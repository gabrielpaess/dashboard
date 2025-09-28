const { Client } = require('pg');
const axios = require('axios');

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dashboard',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123'
};

const TINY_API_TOKEN = process.env.TINY_API_TOKEN || 'a8dfc864f05313e7f9285f6bae3c000120a56c4ad596c62ec9b7ce62a7e9272b';
const TINY_API_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

async function syncAllOrders() {
  const client = new Client(DB_CONFIG);
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    
    console.log('📡 Buscando pedidos da Tiny API...');
    const ordersResponse = await axios.get(TINY_API_URL, {
      params: {
        token: TINY_API_TOKEN,
        formato: 'json',
        dataInicial: '01/01/2025',
        dataFinal: '31/12/2025',
        registrosPorPagina: 1000
      }
    });
    
    const orders = ordersResponse.data.retorno.pedidos || [];
    console.log(`📦 Encontrados ${orders.length} pedidos`);
    
    let processed = 0;
    let inserted = 0;
    let updated = 0;
    
    for (const order of orders) {
      try {
        // Buscar detalhes completos do pedido
        console.log(`🔍 Buscando detalhes do pedido ${order.pedido.id}...`);
        const detailsResponse = await axios.get(ORDER_DETAILS_URL, {
          params: {
            token: TINY_API_TOKEN,
            formato: 'json',
            id: order.pedido.id
          }
        });
        
        const orderDetails = detailsResponse.data.retorno.pedido;
        
        // Mapear itens
        const itens = mapItens(orderDetails.itens || []);
        
        // Verificar se pedido já existe
        const existingOrder = await client.query(
          'SELECT id FROM pedidos WHERE pedido_id = $1',
          [order.pedido.id]
        );
        
        const orderData = {
          pedido_id: order.pedido.id,
          numero: order.pedido.numero,
          nome_cliente: order.pedido.nome_cliente,
          data_pedido: order.pedido.data_pedido ? new Date(order.pedido.data_pedido) : null,
          data_pedido_pt_br: order.pedido.data_pedido_pt_br,
          data_prevista: order.pedido.data_prevista,
          situacao: order.pedido.situacao,
          valor_total: parseFloat(order.pedido.valor_total || 0),
          nome_vendedor: order.pedido.nome_vendedor,
          itens_json: JSON.stringify(itens),
          envio_15: false,
          envio_45: false
        };
        
        if (existingOrder.rows.length > 0) {
          // Atualizar pedido existente
          await client.query(`
            UPDATE pedidos SET
              numero = $2, nome_cliente = $3, data_pedido = $4, data_pedido_pt_br = $5,
              data_prevista = $6, situacao = $7, valor_total = $8, nome_vendedor = $9,
              itens_json = $10, updated_at = CURRENT_TIMESTAMP
            WHERE pedido_id = $1
          `, [
            orderData.pedido_id, orderData.numero, orderData.nome_cliente,
            orderData.data_pedido, orderData.data_pedido_pt_br, orderData.data_prevista,
            orderData.situacao, orderData.valor_total, orderData.nome_vendedor,
            orderData.itens_json
          ]);
          updated++;
        } else {
          // Inserir novo pedido
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
            orderData.itens_json, orderData.envio_15, orderData.envio_45
          ]);
          inserted++;
        }
        
        processed++;
        console.log(`✅ Processado ${processed}/${orders.length}: ${order.pedido.nome_cliente} (${itens.length} itens)`);
        
        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erro ao processar pedido ${order.pedido.id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Sincronização concluída!');
    console.log(`📊 Total processado: ${processed}`);
    console.log(`➕ Inseridos: ${inserted}`);
    console.log(`🔄 Atualizados: ${updated}`);
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  } finally {
    await client.end();
  }
}

function mapItens(itens) {
  if (!itens || !Array.isArray(itens)) return [];
  
  return itens.map(item => {
    const itemData = item.item || item;
    return {
      id: itemData.id_produto || itemData.id,
      codigo: itemData.codigo,
      nome: itemData.nome,
      quantidade: parseFloat(itemData.quantidade || 0),
      valor_unitario: parseFloat(itemData.valor_unitario || 0),
      valor_total: parseFloat(itemData.valor_total || 0),
      unidade: itemData.unidade,
      descricao: itemData.descricao
    };
  });
}

// Executar sincronização
syncAllOrders();
