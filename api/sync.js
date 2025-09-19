/**
 * API Route para Sincronização Automática
 * 
 * Este endpoint pode ser chamado por cron jobs externos (como Vercel Cron)
 * ou por webhooks para manter a sincronização automática funcionando.
 * 
 * Uso:
 * - GET /api/sync - Executa sincronização completa
 * - POST /api/sync - Executa sincronização com parâmetros
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

  // Verificar se é GET ou POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET or POST.' 
    });
  }

  try {
    console.log('🔄 Iniciando sincronização via API...');
    const startTime = Date.now();
    
    const tinyClient = new TinyApiClient();
    let totalProcessed = 0;
    let totalWithItems = 0;
    let totalWithoutItems = 0;
    let currentPage = 1;
    let hasMorePages = true;
    let apiBlockedCount = 0;
    const maxApiBlocks = 3;
    const maxPages = req.query.maxPages ? parseInt(req.query.maxPages) : 10; // Limitar páginas para evitar timeout

    while (hasMorePages && apiBlockedCount < maxApiBlocks && currentPage <= maxPages) {
      try {
        console.log(`📄 Sincronizando página ${currentPage}...`);
        
        const response = await tinyClient.fetchOrders({ 
          pagina: currentPage,
          registrosPorPagina: 50, // Reduzir para evitar timeout
          useCache: false
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log(`⚠️ Nenhum pedido encontrado na página ${currentPage}`);
          hasMorePages = false;
          break;
        }
        
        const pedidos = response.data;
        console.log(`📦 Processando ${pedidos.length} pedidos da página ${currentPage}`);
        
        // Processar pedidos em lotes pequenos
        const batchSize = 3;
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
                if (detailsError.message.includes('API Bloqueada')) {
                  throw detailsError;
                }
                console.warn(`⚠️ Erro ao buscar detalhes do pedido ${pedido.numero}:`, detailsError.message);
                totalWithoutItems++;
              }
              
              // Sincronizar pedido
              await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
              totalProcessed++;
              
            } catch (pedidoError) {
              if (pedidoError.message.includes('API Bloqueada')) {
                throw pedidoError;
              }
              console.error(`❌ Erro ao processar pedido ${pedido.numero}:`, pedidoError.message);
            }
          }));
          
          // Pequeno delay entre lotes
          if (i + batchSize < pedidos.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        // Verificar se há mais páginas
        const totalPages = response.pagination?.totalPages || 1;
        hasMorePages = currentPage < totalPages;
        
        if (hasMorePages) {
          currentPage++;
          // Delay menor entre páginas para evitar timeout
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (pageError) {
        if (pageError.message.includes('API Bloqueada')) {
          apiBlockedCount++;
          console.log(`⚠️ API bloqueada (${apiBlockedCount}/${maxApiBlocks}). Aguardando 30 segundos...`);
          
          if (apiBlockedCount >= maxApiBlocks) {
            console.log(`❌ Máximo de bloqueios da API atingido. Parando sincronização.`);
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 30000));
          apiBlockedCount = 0;
        } else {
          console.error(`❌ Erro ao processar página ${currentPage}:`, pageError.message);
          hasMorePages = false;
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Sincronização finalizada em ${duration}s`);
    console.log(`📊 Resumo: ${totalProcessed} pedidos processados (${totalWithItems} com itens, ${totalWithoutItems} sem itens)`);
    
    return res.status(200).json({
      success: true,
      message: 'Sincronização executada com sucesso',
      data: {
        totalProcessed,
        totalWithItems,
        totalWithoutItems,
        pagesProcessed: currentPage - 1,
        duration: parseFloat(duration),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
