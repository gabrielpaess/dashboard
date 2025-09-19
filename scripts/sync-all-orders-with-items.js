import dotenv from 'dotenv';
import { TinyApiClient } from '../src/services/api/tiny/TinyApiClient.js';
import { pedidosCentralizedService } from '../src/services/pedidosCentralizedService.js';

// Carregar variáveis de ambiente
dotenv.config();

async function syncAllOrdersWithItems() {
  try {
    console.log('🚀 Iniciando sincronização completa de todos os pedidos com itens...');
    
    const tinyClient = new TinyApiClient();
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalWithItems = 0;
    let totalWithoutItems = 0;
    let currentPage = 1;
    let hasMorePages = true;
    let apiBlockedCount = 0;
    const maxApiBlocks = 5; // Máximo de bloqueios da API antes de parar
    
    while (hasMorePages) {
      try {
        console.log(`\n📄 Processando página ${currentPage}...`);
        
        // Buscar pedidos da página atual
        const response = await tinyClient.fetchOrders({ 
          pagina: currentPage,
          registrosPorPagina: 100, // Máximo por página
          useCache: false
        });
        
        if (!response.success || !response.data || response.data.length === 0) {
          console.log(`⚠️ Nenhum pedido encontrado na página ${currentPage}`);
          hasMorePages = false;
          break;
        }
        
        const pedidos = response.data;
        console.log(`📦 Encontrados ${pedidos.length} pedidos na página ${currentPage}`);
        
        // Processar cada pedido
        for (let i = 0; i < pedidos.length; i++) {
          const pedido = pedidos[i];
          try {
            console.log(`  🔄 Processando pedido ${i + 1}/${pedidos.length}: ${pedido.numero} - ${pedido.nome}`);
            
            // Buscar detalhes completos do pedido (incluindo itens)
            let itensData = [];
            let itemsFound = false;
            
            try {
              console.log(`    🔍 Buscando detalhes do pedido ${pedido.numero}...`);
              const detailsResponse = await tinyClient.fetchOrderDetails(pedido.id);
              
              if (detailsResponse.success && detailsResponse.data && detailsResponse.data.length > 0) {
                const detailedOrder = detailsResponse.data[0];
                
                // Extrair itens da estrutura aninhada
                if (Array.isArray(detailedOrder.itens) && detailedOrder.itens.length > 0) {
                  itensData = detailedOrder.itens.map(item => item.item || item);
                  itemsFound = true;
                  totalWithItems++;
                  console.log(`    📦 Encontrados ${itensData.length} itens no pedido ${pedido.numero}`);
                } else {
                  totalWithoutItems++;
                  console.log(`    ⚠️ Nenhum item encontrado no pedido ${pedido.numero}`);
                }
              } else {
                totalWithoutItems++;
                console.log(`    ⚠️ Não foi possível obter detalhes do pedido ${pedido.numero}`);
              }
            } catch (detailsError) {
              if (detailsError.message.includes('API Bloqueada')) {
                apiBlockedCount++;
                console.log(`    ⚠️ API bloqueada (${apiBlockedCount}/${maxApiBlocks}). Aguardando 1 minuto...`);
                
                if (apiBlockedCount >= maxApiBlocks) {
                  console.log(`❌ Máximo de bloqueios da API atingido (${maxApiBlocks}). Parando sincronização.`);
                  hasMorePages = false;
                  break;
                }
                
                // Aguardar 1 minuto antes de continuar
                await new Promise(resolve => setTimeout(resolve, 60000));
                apiBlockedCount = 0; // Reset contador após aguardar
                continue; // Tentar novamente o mesmo pedido
              } else {
                console.error(`    ❌ Erro ao buscar detalhes do pedido ${pedido.numero}:`, detailsError.message);
                totalWithoutItems++;
              }
            }
            
            // Sincronizar pedido individual com itens
            await pedidosCentralizedService.syncPedidoFromAPI(pedido, itensData);
            totalProcessed++;
            
            // Pequeno delay entre pedidos para evitar sobrecarga
            if (i < pedidos.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
            
          } catch (pedidoError) {
            console.error(`    ❌ Erro ao processar pedido ${pedido.numero}:`, pedidoError.message);
            totalErrors++;
          }
        }
        
        // Verificar se há mais páginas
        const totalPages = response.pagination?.totalPages || 1;
        hasMorePages = currentPage < totalPages;
        
        if (hasMorePages) {
          currentPage++;
          console.log(`\n⏳ Aguardando 2 segundos antes da próxima página...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (pageError) {
        if (pageError.message.includes('API Bloqueada')) {
          apiBlockedCount++;
          console.log(`⚠️ API bloqueada na página ${currentPage} (${apiBlockedCount}/${maxApiBlocks}). Aguardando 1 minuto...`);
          
          if (apiBlockedCount >= maxApiBlocks) {
            console.log(`❌ Máximo de bloqueios da API atingido (${maxApiBlocks}). Parando sincronização.`);
            hasMorePages = false;
            break;
          }
          
          // Aguardar 1 minuto antes de continuar
          await new Promise(resolve => setTimeout(resolve, 60000));
          apiBlockedCount = 0; // Reset contador após aguardar
        } else {
          console.error(`❌ Erro ao processar página ${currentPage}:`, pageError.message);
          hasMorePages = false;
        }
      }
    }
    
    console.log('\n✅ Sincronização completa finalizada!');
    console.log('📊 Resumo final:');
    console.log(`   - Total de pedidos processados: ${totalProcessed}`);
    console.log(`   - Pedidos com itens: ${totalWithItems}`);
    console.log(`   - Pedidos sem itens: ${totalWithoutItems}`);
    console.log(`   - Total de erros: ${totalErrors}`);
    console.log(`   - Páginas processadas: ${currentPage}`);
    console.log(`   - Bloqueios da API: ${apiBlockedCount}`);
    
    // Verificar alguns pedidos no Supabase para confirmar
    console.log('\n🔍 Verificando pedidos no Supabase...');
    const { data: pedidos, error } = await pedidosCentralizedService.supabase
      .from('pedidos')
      .select('id, numero, nome_cliente, itens_json')
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (!error && pedidos) {
      console.log(`📊 Encontrados ${pedidos.length} pedidos na consulta`);
      
      pedidos.forEach((pedido, index) => {
        const itemCount = pedido.itens_json && Array.isArray(pedido.itens_json) ? pedido.itens_json.length : 0;
        console.log(`  ${index + 1}. Pedido ${pedido.numero} - ${pedido.nome_cliente} (${itemCount} itens)`);
      });
    }
    
    console.log('\n🎉 Sincronização de todos os pedidos com itens concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error);
  }
}

syncAllOrdersWithItems();

