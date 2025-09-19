/**
 * API Route para Sincronização Manual
 * 
 * Este endpoint pode ser chamado externamente para sincronização mais frequente
 * quando necessário, sem depender do cron job diário.
 * 
 * Uso:
 * - GET /api/sync-manual - Executa sincronização rápida (últimos pedidos)
 * - POST /api/sync-manual - Executa sincronização com parâmetros
 */

import { TinyApiClient } from '../src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from '../src/services/pedidosCentralizedService.js';

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.' 
    });
  }

  try {
    console.log('🔄 Iniciando sincronização manual...');
    const startTime = Date.now();
    
    const tinyClient = new TinyApiClient();
    let totalProcessed = 0;
    let totalWithItems = 0;
    let totalWithoutItems = 0;
    
    // Para sincronização manual, focar apenas nas últimas páginas
    const maxPages = 3; // Apenas 3 páginas para execução rápida
    const batchSize = 3; // Lotes pequenos para execução rápida
    
    for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
      try {
        console.log(`📄 Sincronizando página ${currentPage}...`);
        
        const response = await tinyClient.fetchOrders({ 
          pagina: currentPage,
          registrosPorPagina: 50, // Menos registros para execução rápida
          useCache: false
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log(`⚠️ Nenhum pedido encontrado na página ${currentPage}`);
          break;
        }
        
        const pedidos = response.data;
        console.log(`📦 Processando ${pedidos.length} pedidos da página ${currentPage}`);
        
        // Processar pedidos em lotes pequenos
        for (let i = 0; i < pedidos.length; i += batchSize) {
          const batch = pedidos.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (pedido) => {
            try {
              // Buscar detalhes do pedido
              let itensData = [];
              try {
                const detailsResponse = await tinyClient.fetchOrderDetails(pedido.id);
                
                if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
                  const detailedOrder = detailsResponse.data[0];
                  
                  if (Array.isArray(detailedOrder.itens) && detailedOrder.itens.length > 0) {
                    itensData = detailedOrder.itens.map(item => item.item || item);
                    totalWithItems++;
                  } else {
                    totalWithoutItems++;
                  }
                } else {
                  totalWithoutItems++;
                }
              } catch (detailsError) {
                console.warn(`⚠️ Erro ao buscar detalhes do pedido ${pedido.numero}:`, detailsError.message);
                totalWithoutItems++;
              }
              
              // Sincronizar pedido
              await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
              totalProcessed++;
              
            } catch (pedidoError) {
              console.error(`❌ Erro ao processar pedido ${pedido.numero}:`, pedidoError.message);
            }
          }));
          
          // Delay mínimo entre lotes
          if (i + batchSize < pedidos.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Delay mínimo entre páginas
        if (currentPage < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
      } catch (pageError) {
        console.error(`❌ Erro ao processar página ${currentPage}:`, pageError.message);
        break;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Sincronização manual finalizada em ${duration}s`);
    console.log(`📊 Resumo: ${totalProcessed} pedidos processados (${totalWithItems} com itens, ${totalWithoutItems} sem itens)`);
    
    return res.status(200).json({
      success: true,
      message: 'Sincronização manual executada com sucesso',
      data: {
        totalProcessed,
        totalWithItems,
        totalWithoutItems,
        pagesProcessed: maxPages,
        duration: parseFloat(duration),
        timestamp: new Date().toISOString(),
        type: 'manual'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização manual:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      type: 'manual'
    });
  }
}
