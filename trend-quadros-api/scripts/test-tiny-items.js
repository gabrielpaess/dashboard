/**
 * Script para testar se a API Tiny está retornando itens nos detalhes dos pedidos
 */

const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables
dotenv.config();

const TINY_API_TOKEN = process.env.TINY_API_TOKEN;
const BASE_URL = 'https://api.tiny.com.br/api2/pedidos.pesquisa.php';
const ORDER_DETAILS_URL = 'https://api.tiny.com.br/api2/pedido.obter.php';

async function testTinyItems() {
  console.log('🔍 Testando se a API Tiny retorna itens nos detalhes dos pedidos...\n');

  if (!TINY_API_TOKEN) {
    console.error('❌ TINY_API_TOKEN não encontrado no .env');
    return;
  }

  try {
    // 1. Buscar alguns pedidos
    console.log('1️⃣ Buscando pedidos da API Tiny...');
    const params = new URLSearchParams({
      token: TINY_API_TOKEN,
      formato: 'json',
      pesquisa: 'data_inicial:2025-01-01 data_final:2025-12-31 situacao:Todos',
      pagina: '1',
      limite: '5'
    });

    const response = await axios.post(BASE_URL, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.data || !response.data.retorno || !response.data.retorno.pedidos) {
      console.error('❌ Resposta inválida da API Tiny');
      return;
    }

    const orders = response.data.retorno.pedidos;
    console.log(`✅ Encontrados ${orders.length} pedidos\n`);

    // 2. Testar detalhes de cada pedido
    for (let i = 0; i < Math.min(3, orders.length); i++) {
      const order = orders[i].pedido;
      const orderId = order.id;
      
      console.log(`2️⃣ Testando detalhes do pedido ${orderId}...`);
      
      try {
        const detailParams = new URLSearchParams({
          token: TINY_API_TOKEN,
          id: orderId.toString(),
          formato: 'json'
        });

        const detailResponse = await axios.post(ORDER_DETAILS_URL, detailParams.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (detailResponse.data && detailResponse.data.retorno && detailResponse.data.retorno.pedido) {
          const pedidoData = detailResponse.data.retorno.pedido;
          
          console.log(`   📋 Pedido: ${pedidoData.numero || 'N/A'}`);
          console.log(`   👤 Cliente: ${pedidoData.nome || 'N/A'}`);
          console.log(`   💰 Valor: R$ ${pedidoData.valor || 'N/A'}`);
          console.log(`   📦 Itens: ${pedidoData.itens ? pedidoData.itens.length : 0}`);
          
          if (pedidoData.itens && pedidoData.itens.length > 0) {
            console.log('   🔍 Detalhes dos itens:');
            pedidoData.itens.forEach((item, index) => {
              const itemData = item.item || item;
              console.log(`     ${index + 1}. ${itemData.descricao || 'Sem descrição'}`);
              console.log(`        Quantidade: ${itemData.quantidade || 0}`);
              console.log(`        Valor Unitário: R$ ${itemData.valor_unitario || 0}`);
              console.log(`        Valor Total: R$ ${itemData.valor_total || 0}`);
            });
          } else {
            console.log('   ⚠️  Nenhum item encontrado neste pedido');
          }
          
          // Mostrar estrutura completa do pedido para debug
          console.log('\n   🔍 Estrutura completa do pedido:');
          console.log(JSON.stringify(pedidoData, null, 2));
          
        } else {
          console.log(`   ❌ Erro ao buscar detalhes do pedido ${orderId}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao buscar detalhes do pedido ${orderId}: ${error.message}`);
      }
      
      console.log('\n---\n');
      
      // Delay entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro ao testar API Tiny:', error.message);
    if (error.response) {
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testTinyItems();
