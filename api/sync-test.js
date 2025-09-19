/**
 * API Route para Teste de Sincronização
 * 
 * Versão simplificada para testar conectividade sem timeout
 */

import { TinyApiClient } from '../src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from '../src/services/pedidosCentralizedService.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    console.log('🧪 Iniciando teste de sincronização...');
    const startTime = Date.now();
    
    // Teste 1: API Tiny
    console.log('1️⃣ Testando API Tiny...');
    const tinyClient = new TinyApiClient();
    const tinyResponse = await tinyClient.fetchOrders({ 
      pagina: 1,
      registrosPorPagina: 5,
      useCache: false
    });
    
    if (!tinyResponse.success) {
      throw new Error(`API Tiny falhou: ${tinyResponse.error}`);
    }
    
    console.log(`✅ API Tiny OK - ${tinyResponse.data?.length || 0} pedidos`);
    
    // Teste 2: Supabase
    console.log('2️⃣ Testando Supabase...');
    const supabaseResponse = await pedidosCentralizedService.getPedidos();
    
    if (!Array.isArray(supabaseResponse)) {
      throw new Error('Supabase retornou dados inválidos');
    }
    
    console.log(`✅ Supabase OK - ${supabaseResponse.length} pedidos no banco`);
    
    // Teste 3: Sincronização de 1 pedido
    console.log('3️⃣ Testando sincronização de 1 pedido...');
    if (tinyResponse.data && tinyResponse.data.length > 0) {
      const pedido = tinyResponse.data[0];
      
      // Buscar detalhes do pedido
      let itensData = [];
      try {
        const detailsResponse = await tinyClient.fetchOrderDetails(pedido.id);
        if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
          const detailedOrder = detailsResponse.data[0];
          if (Array.isArray(detailedOrder.itens) && detailedOrder.itens.length > 0) {
            itensData = detailedOrder.itens.map(item => item.item || item);
          }
        }
      } catch (detailsError) {
        console.warn(`⚠️ Erro ao buscar detalhes: ${detailsError.message}`);
      }
      
      // Sincronizar pedido
      await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
      console.log(`✅ Sincronização OK - Pedido ${pedido.numero} processado`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Teste concluído em ${duration}s`);
    
    return res.status(200).json({
      success: true,
      message: 'Teste de sincronização executado com sucesso',
      data: {
        tinyApi: {
          working: true,
          pedidosFound: tinyResponse.data?.length || 0
        },
        supabase: {
          working: true,
          pedidosInDb: supabaseResponse.length
        },
        sync: {
          working: true,
          testPedido: tinyResponse.data?.[0]?.numero || 'N/A'
        },
        duration: parseFloat(duration),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
